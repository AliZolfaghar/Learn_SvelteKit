// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** زمان شروع پردازش درخواست در handle (epoch ms) */
			requestStartedAt?: number;
		}
		interface PageData {
			title?: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
