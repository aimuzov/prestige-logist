/**
 * Ошибки API уходят в Sentry, в общий с сайтом проект `prestige-logist`, их различает тег
 * `component`. Только ошибки, без трейсинга. Без `SENTRY_DSN` (локально, в тестах)
 * SDK не включается, а `captureException` ничего не делает.
 *
 * В поручениях и заявках лежат реквизиты, адреса и люди, поэтому SDK не берёт из запроса
 * ничего: ни заголовки и тела, ни query поиска адреса, ни локальные переменные в стеке.
 *
 * Модуль импортируется в server.ts первым: тогда необработанные исключения ловятся
 * с самого старта.
 */

import * as Sentry from '@sentry/node'

import pkg from '#package.json' with { type: 'json' }

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: 'production',
		release: `prestige-logist@${pkg.version}`,
		initialScope: { tags: { component: 'api' } },
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false,
			genAI: { inputs: false, outputs: false },
			stackFrameVariables: false,
		},
		// Без сессий: только ошибки, а не сводка по каждому запросу.
		integrations: [Sentry.httpIntegration({ sessions: false })],
	})
}

export const { captureException } = Sentry
