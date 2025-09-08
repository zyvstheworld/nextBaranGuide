import withSerwist from '@serwist/next'

const withSW = withSerwist({
	swSrc: 'src/sw.ts',
	swDest: 'public/sw.js',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
}

export default withSW(nextConfig)


