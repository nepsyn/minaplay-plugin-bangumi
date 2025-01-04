import {
  MinaPlayPluginParser,
  PluginSourceParser,
  ApiPaginationResultDto,
} from '@minaplay/server';
import { CalendarItem, Episode, Subject } from './bangumi.interface.js';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ConfigService } from '@nestjs/config';
import process from 'node:process';

@MinaPlayPluginParser()
export class BangumiParser implements PluginSourceParser {
  agent?: HttpsProxyAgent<string>;

  constructor(configService: ConfigService) {
    const proxy = configService.get('APP_HTTP_PROXY') || process.env.HTTP_PROXY;
    if (proxy) {
      this.agent = new HttpsProxyAgent(proxy);
    }
  }

  async getCalendar() {
    const response = await fetch(`https://api.bgm.tv/calendar`, {
      agent: this.agent,
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });

    let data = await response.json() as CalendarItem[];
    return data.map(({ weekday, items }) => {
      return {
        weekday: weekday.id % 7 as any,
        items: items.filter(({ type }) => type === 2).map((item) => {
          return {
            id: item.id,
            name: item.name_cn || item.name,
            description: item.summary,
            posterUrl: item.images?.common,
            count: item.total_episodes,
            pubAt: new Date(item.date),
            tags: (item.tags ?? []).map(({ name }) => name),
          };
        }),
      };
    });
  }

  async getSeriesById(id: string) {
    const response = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, {
      agent: this.agent,
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    const item = await response.json() as Subject;
    return {
      id: item.id,
      name: item.name_cn || item.name,
      description: item.summary,
      posterUrl: item.images?.common,
      count: item.total_episodes,
      pubAt: new Date(item.date),
      tags: (item.tags ?? []).map(({ name }) => name),
    };
  }

  async getEpisodesBySeriesId(id: string | number, page?: number, size?: number) {
    const response = await fetch(`https://api.bgm.tv/v0/episodes?subject_id=${id}&type=0&offset=${(page ?? 0) * (size ?? 100)}&limit=${size ?? 100}`, {
      agent: this.agent,
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    const result = await response.json() as { data: Episode[], total: number };
    return new ApiPaginationResultDto(
      result.data.map((item) => ({
        title: item.name_cn || item.name,
        no: String(item.ep).padStart(2, '0'),
        pubAt: Date.parse(item.airdate) ? new Date(item.airdate) : undefined,
      })),
      result.total,
      page,
      size,
    );
  }

  async searchSeries(keyword: string, page?: number, size?: number) {
    const response = await fetch(
      `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}?type=2&responseGroup=small&start=${(page ?? 0) * (size ?? 25)}&max_results=${size ?? 25}`,
      {
        agent: this.agent,
        headers: {
          'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
        },
      });
    const data = await response.json() as { results: number; list: Subject[] };
    return new ApiPaginationResultDto(
      data.list.map((item) => ({
        id: item.id,
        name: item.name_cn || item.name,
        description: item.summary,
        posterUrl: item.images?.common,
        count: item.total_episodes,
        pubAt: new Date(item.date),
        tags: (item.tags ?? []).map(({ name }) => name),
      })),
      data.results,
      page,
      size,
    );
  }
}
