import { HttpService } from '@nestjs/axios';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { firstValueFrom } from 'rxjs';
import { Context } from 'telegraf';
import { parseStringPromise } from 'xml2js'; // для парсинга XML


@Update()
export class AppService {
    constructor(
        private readonly httpService: HttpService
    ) { }

    private async getRate(): Promise<string> {
        const response = await firstValueFrom(
            this.httpService.get('https://www.cbr.ru/scripts/XML_daily.asp')
        ); // Загрузка курсов из ЦБ

        const parsedXml = await parseStringPromise(response.data); // Парсинг XML в объект
        const usdRate: string = parsedXml.ValCurs.Valute.find((val) => val.CharCode[0] === 'USD').Value[0]; // Поиск объекта с долларом США. Взятие значения с курсом
        return usdRate;
    }

    @Start()
    async startBot(@Ctx() ctx: Context) {
        const greeting: string = 'Добрый день. Как вас зовут?';
        ctx.reply(greeting);
    }

    @On('text') // Ответ с курсом валюты
    async onText(@Ctx() ctx: Context & { message: Message.TextMessage }) {
        const username: string = ctx.message.text; // Берем ответ пользователя в качестве его имени
        const rate: string = await this.getRate();
        const answer: string = `Рад знакомству, ${username}! Курс доллара сегодня: ${rate}`;
        await ctx.reply(answer);
    }
}

