/// <reference lib="webworker" />
export {}
import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any }

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: defaultCache,
})

serwist.addEventListeners()

// Optional: App Router navigation fallback to offline page
self.addEventListener('fetch', (event) => {
	const request = event.request
	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				try {
					return await fetch(request)
				} catch {
					return (await caches.match('/offline')) ?? Response.error()
				}
			})()
		)
	}
})


