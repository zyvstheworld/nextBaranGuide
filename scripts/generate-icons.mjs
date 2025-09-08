import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(process.cwd())
const srcPath = path.join(root, 'public', 'baranguide-log.png')
const outDir = path.join(root, 'public', 'icons')

const sizes = [192, 512]

async function ensureOutDir() {
	await fs.promises.mkdir(outDir, { recursive: true })
}

async function generate() {
	if (!fs.existsSync(srcPath)) {
		console.error(`Source image not found at: ${srcPath}`)
		process.exit(1)
	}

	await ensureOutDir()

	for (const size of sizes) {
		const outPath = path.join(outDir, `icon-${size}.png`)
		await sharp(srcPath)
			.resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
			.png({ compressionLevel: 9 })
			.toFile(outPath)
		console.log(`Generated ${outPath}`)
	}

	console.log('Done.')
}

generate().catch((err) => {
	console.error(err)
	process.exit(1)
})


