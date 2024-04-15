import { File, MinaPlayPlugin, Series, SeriesTag } from '@minaplay/server';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BangumiCommand } from './bangumi.command.js';
import { BangumiParser } from './bangumi.parser.js';

const icon = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALJu+f//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsm75ELJu+cCybvn/sm75/7Ju+f+ybvn//////7Ju+f+ybvn/sm75/7Ju+f+ybvn/sm75/7Ju+f+ybvnAsm75ELJu+cCybvn/sm75/7Ju+f+ybvn/sm75////////////sm75/7Ju+f+ybvn/sm75/7Ju+f+ybvn/sm75/7Ju+cCwaPn/sGj5/9iz/P///////////////////////////////////////////////////////////9iz/P+waPn/rF/6/6xf+v//////////////////////////////////////////////////////////////////////rF/6/6lW+/+pVvv/////////////////////////////////zXn2/////////////////////////////////6lW+/+lTfz/pU38///////Nefb/zXn2/8159v//////zXn2///////Nefb//////8159v/Nefb/zXn2//////+lTfz/okT8/6JE/P//////////////////////2bb8/8159v/Nefb/zXn2/9m2/P//////////////////////okT8/546/f+eOv3//////8159v/Nefb/zXn2////////////////////////////zXn2/8159v/Nefb//////546/f+bMf7/mzH+//////////////////////////////////////////////////////////////////////+bMf7/lyj+wJco/v/Mk/7////////////////////////////////////////////////////////////Mk///lyj+wJQf/xCUH//AlB///5Qf//+UH///lB///5Qf//+aP///mj///5o///+UH///lB///5Qf//+UH///lB//wJQf/xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/5o////Nefb/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAM159v8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzXn2/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADNefb/AAAAAAAAAAAAAAAA+f8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/j8AAP3fAAD77wAA9/cAAA==';

@MinaPlayPlugin({
  id: 'bangumi',
  icon,
  version: '1.0.1',
  supportVersion: '0.1.1',
  description: 'Bangumi support in MinaPlay',
  author: 'MinaPlay',
  repo: 'https://github.com/nepsyn/minaplay-plugin-bangumi',
  license: 'AGPL-3.0',
  imports: [TypeOrmModule.forFeature([SeriesTag, Series, File])],
  providers: [BangumiCommand, BangumiParser],
})
export class BangumiPlugin {}
