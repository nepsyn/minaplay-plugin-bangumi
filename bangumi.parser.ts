import {
  MinaPlayPluginParser,
  PluginSourceParser,
  ApiPaginationResultDto,
} from '@minaplay/server';
import { CalendarItem, Episode, Subject } from './bangumi.interface.js';

@MinaPlayPluginParser()
export class BangumiParser implements PluginSourceParser {
  async getCalendar() {
    const response = await fetch(`https://api.bgm.tv/calendar`, {
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });

    let data: CalendarItem[] = await response.json();
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
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    const item: Subject = await response.json();
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
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });
    const result: { data: Episode[], total: number } = await response.json();
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
        headers: {
          'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
        },
      });
    const data: { results: number; list: Subject[] } = await response.json();
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
