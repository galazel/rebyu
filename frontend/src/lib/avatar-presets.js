// Character crops from the DrawKit Education Illustration Pack (public/avatars).
export const AVATAR_PRESETS = Array.from({ length: 13 }, (_, index) => {
  const id = `avatar-${String(index + 1).padStart(2, "0")}`
  return { id, src: `/avatars/${id}.svg` }
})

const BACKGROUNDS = ["#FDF1D6", "#E3F4F1", "#FDE4DF", "#E6EEFB", "#F1E8F6"]

// Stable pick per user so someone without a photo always sees the same face.
export function defaultAvatarFor(seed) {
  const text = String(seed ?? "")
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  return AVATAR_PRESETS[hash % AVATAR_PRESETS.length].src
}

// The avatar endpoint only takes raster images, so presets are drawn to a PNG first.
export async function presetToPngFile(preset, size = 512) {
  const image = new Image()
  image.src = preset.src
  await image.decode()

  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  const index = AVATAR_PRESETS.findIndex((item) => item.id === preset.id)
  context.fillStyle = BACKGROUNDS[Math.max(index, 0) % BACKGROUNDS.length]
  context.fillRect(0, 0, size, size)
  context.drawImage(image, 0, 0, size, size)

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Could not draw the avatar."))), "image/png")
  )
  return new File([blob], `${preset.id}.png`, { type: "image/png" })
}

export function presetBackground(index) {
  return BACKGROUNDS[index % BACKGROUNDS.length]
}
