import { Injectable } from '@nestjs/common';
import { Command } from 'commander';
import {
  MinaPlayCommand,
  MinaPlayListenerInject,
  MinaPlayCommandArgument,
  Text,
  PluginChat,
  Consumed,
  NetworkImage,
  Series,
  SeriesTag,
  File,
  USER_UPLOAD_IMAGE_DIR,
  Action,
  ConsumableGroup,
  FileSourceEnum,
  Pending,
  Timeout,
  User,
  ResourceSeries, MinaPlayCommandOption, MinaPlayMessage,
} from '@minaplay/server';
import { CalendarItem, Subject } from './bangumi.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fs from 'node:fs';
import path from 'node:path';
import { generateMD5 } from '@minaplay/server/dist/utils/generate-md5.util.js';
import fetch from 'node-fetch';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import process from 'node:process';

@Injectable()
export class BangumiCommand {
  agent?: HttpsProxyAgent<string>;

  constructor(
    @InjectRepository(Series) private seriesRepository: Repository<Series>,
    @InjectRepository(SeriesTag)
    private seriesTagRepository: Repository<SeriesTag>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    configService: ConfigService,
  ) {
    const proxy = configService.get('APP_HTTP_PROXY') || process.env.HTTP_PROXY;
    if (proxy) {
      this.agent = new HttpsProxyAgent(proxy);
    }
  }

  @MinaPlayCommand('bangumi', {
    aliases: ['bgm'],
    description: 'Bangumi support in MinaPlay',
  })
  async handleBangumi(@MinaPlayListenerInject() program: Command) {
    return program.helpInformation();
  }

  @MinaPlayCommand('add', {
    description: 'add an anime in Bangumi by subject ID',
    parent: () => BangumiCommand.prototype.handleBangumi,
  })
  async handleAdd(
    @MinaPlayCommandArgument('<id>', {
      description: 'subject ID',
    })
      id: string,
    @MinaPlayListenerInject() user: User,
    @MinaPlayListenerInject() chat: PluginChat,
  ) {
    const groupId = Date.now().toString();
    try {
      const response = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, {
        agent: this.agent,
        headers: {
          'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
        },
      });
      if (!response.ok) {
        return new Text(`Bangumi subject '${id}' not found`, Text.Colors.ERROR);
      }

      const data = await response.json() as Subject;
      if (data.type !== 2) {
        return new Text(`Bangumi subject '${id}' not found`, Text.Colors.ERROR);
      }

      const name = data.name_cn || data.name;
      await chat.send([
        new Text(`Find series '${name}' , add it to MinaPlay now? (Y/n)`),
        new NetworkImage(data.images.large),
        new ConsumableGroup(groupId, [
          new Action('yes', new Text('Yes')),
          new Action('no', new Text('No')),
          new Action('cancel', new Text('Cancel')),
          new Timeout(30000),
        ]),
      ]);
      try {
        const resp = await chat.receive(30000);
        if (resp.type !== 'Text' || !['yes', 'y'].includes(resp.content.toLowerCase())) {
          return [new Consumed(groupId), new Text(`Add series '${name}' canceled`)];
        }
      } catch {
        return [new Consumed(groupId), new Text(`Add series '${name}' canceled`)];
      }
      await chat.send(new Consumed(groupId));

      await chat.send(new ConsumableGroup(groupId, [new Text(`Adding series '${name}' ...`), new Pending()]));

      const tags = (data.tags ?? []).map(({ name }) => ({ name }));
      await this.seriesTagRepository.save(tags);
      const ext = path.extname(data.images.common);
      const imageResp = await fetch(data.images.common, { agent: this.agent });
      const imageData = Buffer.from(await imageResp.arrayBuffer());
      const filepath = path.join(USER_UPLOAD_IMAGE_DIR, `${await generateMD5(data.images.common)}${ext}`);
      await fs.promises.writeFile(filepath, imageData);
      const { id: imageId } = await this.fileRepository.save({
        filename: path.basename(data.images.common),
        name: path.basename(data.images.common),
        size: imageData.length,
        md5: await generateMD5(fs.createReadStream(filepath)),
        mimetype: ext.endsWith('png') ? 'image/png' : 'image/jpeg',
        source: FileSourceEnum.USER_UPLOAD,
        path: filepath,
      });
      const { id: seriesId } = await this.seriesRepository.save({
        name: name,
        pubAt: new Date(data.date),
        count: data.total_episodes,
        description: data.summary,
        user: { id: user.id },
        poster: { id: imageId },
        tags,
      });
      return [
        new Text(`Series '${name}' added`, Text.Colors.SUCCESS),
        new ResourceSeries(await this.seriesRepository.findOneBy({ id: seriesId })),
      ];
    } catch {
      return new Text(`Bangumi subject '${id}' not found`, Text.Colors.ERROR);
    } finally {
      await chat.send(new Consumed(groupId));
    }
  }

  @MinaPlayCommand('calendar', {
    aliases: ['c'],
    description: `show calendar in Bangumi`,
    parent: () => BangumiCommand.prototype.handleBangumi,
  })
  async handleCalendar(
    @MinaPlayCommandOption('-a,--all', {
      description: 'Show all weekday items',
      default: false,
    }) all: boolean,
  ) {
    const response = await fetch(`https://api.bgm.tv/calendar`, {
      agent: this.agent,
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    if (!response.ok) {
      return new Text(`Fetch Bangumi calendar failed`, Text.Colors.ERROR);
    }

    let data = await response.json() as CalendarItem[];
    if (!all) {
      const now = new Date();
      data = data.filter(({ weekday }) => now.getDay() === weekday.id % 7);
    }
    const messages: MinaPlayMessage[] = [];
    for (const { weekday, items } of data) {
      const subjects = items.filter(({ type }) => type === 2);
      messages.push(new Text(`${weekday.cn}\n`, Text.Colors.INFO));
      if (subjects.length < 0) {
        messages.push(new Text(`无放送番组\n`));
      } else {
        for (const subject of subjects) {
          messages.push(new Text(`${subject.name_cn || subject.name}\t${subject.id}`));
        }
      }
      messages.push(new Text('\n'));
    }
    return messages;
  }

  @MinaPlayCommand('search', {
    aliases: ['s'],
    description: `search anime in Bangumi`,
    parent: () => BangumiCommand.prototype.handleBangumi,
  })
  async handleSearch(
    @MinaPlayCommandArgument('<keyword>', {
      description: 'subject keyword',
    })
      keyword: string,
    @MinaPlayListenerInject() chat: PluginChat,
  ) {
    const response = await fetch(`https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=2&responseGroup=small`, {
      agent: this.agent,
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    if (!response.ok) {
      return new Text(`Cannot find subjects by keyword: ${keyword}`, Text.Colors.ERROR);
    }

    let data = await response.json() as { results: number; list: Subject[] };
    if (data.results === 0) {
      return new Text(`Cannot find subjects by keyword: ${keyword}`, Text.Colors.ERROR);
    }

    const messages: MinaPlayMessage[] = [
      new Text(`Search results for keyword: ${keyword} , total ${data.results} items\n`, Text.Colors.INFO),
    ];
    for (const subject of data.list) {
      messages.push(new Text(`${subject.name_cn || subject.name}\t${subject.id}`));
    }
    return messages;
  }
}
