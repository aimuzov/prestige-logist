// Именованный импорт: в бандл попадает только версия, а не весь package.json.
import { version } from '#package.json'

/**
 * Отправляет ошибки браузера в Sentry, в общий с API проект, с тегом `component: site`.
 * Только ошибки, без трейсинга и Replay.
 *
 * DSN вшивается при сборке из `PUBLIC_SENTRY_DSN`. Без него и в `astro dev` SDK не грузится:
 * он лежит отдельным чанком и подтягивается после загрузки страницы.
 */
export async function sentry() {
	const dsn = import.meta.env.PUBLIC_SENTRY_DSN

	if (!dsn || import.meta.env.DEV) return

	// Деструктуризация даёт Rollup выкинуть из чанка всё, кроме init.
	const { init } = await import('@sentry/browser')

	init({
		dsn,
		environment: 'production',
		release: `prestige-logist@${version}`,
		initialScope: { tags: { component: 'site' } },
		// Без сессий: иначе SDK шлёт запрос на каждый заход, а не только при ошибке.
		integrations: (defaults) => defaults.filter(({ name }) => name !== 'BrowserSession'),
	})
}
