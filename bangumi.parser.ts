import {
  MinaPlayPluginParser,
  MinaPlayPluginSourceCalendarDay,
  PluginSourceParser,
} from '@minaplay/server';
import { CalendarItem, Subject } from './bangumi.interface.js';

@MinaPlayPluginParser()
export class BangumiParser implements PluginSourceParser {
  private cachedCalendar: MinaPlayPluginSourceCalendarDay[] = undefined;

  private get cachedCalendarSeries() {
    return this.cachedCalendar ? this.cachedCalendar.flatMap(({ items }) => items) : [];
  }

  async getCalendar() {
    if (this.cachedCalendar) {
      return this.cachedCalendar;
    }

    const response = await fetch(`https://api.bgm.tv/calendar`, {
      headers: {
        'User-Agent': 'nepsyn/minaplay-plugin-bangumi',
      },
    });

    let data: CalendarItem[] = await response.json();
    this.cachedCalendar = data.map(({ weekday, items }) => {
      return {
        weekday: weekday.id % 7 as any,
        items: items.filter(({ type }) => type === 2).map((item) => {
          return {
            id: item.id,
            name: item.name_cn || item.name,
            description: item.summary,
            posterUrl: item.images.common,
            count: item.total_episodes,
            pubAt: new Date(item.date),
            tags: item.tags.map(({ name }) => name),
          };
        }),
      };
    });
    return this.cachedCalendar;
  }

  async getSeriesById(id: string) {
    const cached = this.cachedCalendarSeries.find((series) => String(series.id) === id);
    if (cached) {
      return cached;
    }

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
      posterUrl: item.images.common,
      count: item.total_episodes,
      pubAt: new Date(item.date),
      tags: item.tags.map(({ name }) => name),
    };
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
    return data.list.map((item) => ({
      id: item.id,
      name: item.name_cn || item.name,
      description: item.summary,
      posterUrl: item.images.common,
      count: item.total_episodes,
      pubAt: new Date(item.date),
      tags: item.tags.map(({ name }) => name),
    }));
  }
}
