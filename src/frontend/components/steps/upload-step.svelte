<script lang="ts">
	import BookOpen from '@lucide/svelte/icons/book-open'
	import Download from '@lucide/svelte/icons/download'
	import FileCheck from '@lucide/svelte/icons/file-check-corner'
	import FolderOpen from '@lucide/svelte/icons/folder-open'
	import Sparkles from '@lucide/svelte/icons/sparkles'

	import type { OrderSummary } from '#shared/request.ts'
	import Alert from '@aimuzov/infra-site-kit/ui/alert.svelte'
	import Button from '@aimuzov/infra-site-kit/ui/button.svelte'
	import Card from '@aimuzov/infra-site-kit/ui/card.svelte'
	import ChipButton from '@aimuzov/infra-site-kit/ui/chip-button.svelte'
	import Dropzone from '@aimuzov/infra-site-kit/ui/dropzone.svelte'
	import { pickFile } from '@aimuzov/infra-site-kit/ui/files.js'
	import Skeleton from '@aimuzov/infra-site-kit/ui/skeleton.svelte'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

	const SUMMARY_LABELS: Array<[keyof OrderSummary, string]> = [
		['number', 'Поручение №'],
		['date', 'Дата'],
		['client', 'Клиент'],
		['forwarder', 'Экспедитор'],
		['consignor', 'Грузоотправитель'],
		['cargo', 'Груз'],
		['packageCount', 'Мест'],
		['grossWeight', 'Вес брутто, кг'],
		['bodyType', 'Кузов'],
		['shipment', 'Отгрузка'],
		['delivery', 'Доставка'],
		['from', 'Погрузка'],
		['to', 'Выгрузка'],
	]

	const ACCEPT = '.zip,.xml'

	const take = (file?: File | null) => {
		if (file) wizard.analyze(file)
	}

	/** Пример лежит рядом со статикой: посетитель видит форму в деле, не ища своего комплекта. */
	const DEMO = '/demo/poruchenie-primer.zip'

	async function tryDemo() {
		const response = await fetch(DEMO)

		if (!response.ok) {
			wizard.analyzeError = `Пример не загрузился: ${response.status}`

			return
		}

		take(new File([await response.blob()], DEMO.split('/').pop() ?? ''))
	}
</script>

<div class="upload">
	<!-- Разобранное поручение занимает место дропзоны: загружать второй раз незачем,
	     а понадобится — рядом со сводкой есть «Заменить». Пока сервер разбирает файл,
	     на этом месте заготовка той же сводки. -->
	{#if wizard.analyzing}
		<div role="status" aria-label="Разбираем комплект">
			<Card>
				<div class="upload__skeleton-head">
					<Skeleton width="1rem" height="1rem" />
					<Skeleton width="12rem" height="1rem" />
				</div>
				<div class="upload__summary">
					{#each SUMMARY_LABELS as [key], index (key)}
						<Skeleton width="7rem" />
						<Skeleton width={`${[60, 35, 70, 75, 65, 30, 15, 20, 40, 50, 50, 80, 55][index] ?? 50}%`} />
					{/each}
				</div>
			</Card>
		</div>
	{:else if !wizard.summary}
		<Dropzone
			size="lg"
			accept={ACCEPT}
			label="Загрузить комплект поручения"
			title="Перетащите сюда комплект поручения"
			note="zip «полного документооборота» или отдельный ON_POREXPKLT_*.xml"
			onfile={take}
		/>

		<div class="upload__demo">
			<p class="upload__demo-text">
				<span class="upload__demo-title">Нет комплекта под рукой?</span>
				Откройте пример — синтетическое поручение, на нём видно все шаги. Или
				<a class="upload__demo-link" href={DEMO} download tabindex="-1"
					><Download class="upload__demo-icon" size={14} />скачайте архив</a
				>, чтобы загрузить его сами.
				<!-- Отдельной строкой: это не продолжение фразы про пример, а ссылка на справку. -->
				<a class="upload__demo-link upload__demo-link--more" href="/about" tabindex="-1">
					<BookOpen size={14} />
					Как это работает
				</a>
			</p>
			<Button variant="outline" size="lg" tabindex={-1} disabled={wizard.analyzing} onclick={tryDemo}>
				<Sparkles size={16} />
				Открыть пример
			</Button>
		</div>
	{/if}

	{#if wizard.analyzeError}
		<Alert variant="danger">{wizard.analyzeError}</Alert>
	{/if}

	{#if wizard.summary && !wizard.analyzing}
		{@const summary = wizard.summary}
		<Card title={wizard.fileName} icon={FileCheck}>
			{#snippet action()}
				<ChipButton disabled={wizard.analyzing} onclick={async () => take(await pickFile(ACCEPT))}>
					<FolderOpen size={14} />
					Заменить
				</ChipButton>
			{/snippet}
			<dl class="upload__summary">
				{#each SUMMARY_LABELS as [key, label] (key)}
					<dt class="upload__term">{label}</dt>
					<dd>{summary[key] || '—'}</dd>
				{/each}
			</dl>
		</Card>
	{/if}
</div>

<style>
	.upload {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__demo {
			display: flex;
			gap: 1rem;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 1.25rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			background: var(--bg);
			box-shadow: var(--shadow-sm);

			@media (--below-sm) {
				flex-direction: column;
				align-items: stretch;
			}
		}

		&__demo-text {
			color: var(--muted);
			text-wrap: pretty;
		}

		&__demo-title {
			display: block;
			font-weight: 500;
			color: var(--fg);
		}

		/* Ссылка — короткая фраза («Как это работает», «скачайте архив»): переносить её целиком. */
		&__demo-link {
			color: var(--accent);
			text-underline-offset: 2px;
			white-space: nowrap;
		}

		/* Значок внутри строки текста: опущен к середине строчных букв. */
		& :global(.upload__demo-icon) {
			margin-inline-end: 0.25rem;
			vertical-align: -0.125em;
		}

		&__demo-link--more {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			width: fit-content;
			margin-top: 0.5rem;
		}

		&__summary {
			display: grid;
			gap: 0.625rem 2rem;

			@media (--sm) {
				grid-template-columns: max-content 1fr;
			}
		}

		&__term {
			color: var(--muted);
		}

		/* Заготовка шапки сводки: иконка и имя файла, ростом как заголовок карточки. */
		&__skeleton-head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			height: 1.5rem;
		}
	}
</style>
