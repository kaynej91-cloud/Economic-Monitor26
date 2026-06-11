export function downsample(
  observations: { date: string; value: number }[],
  maxPoints: number
): { date: string; value: number }[] {
  if (observations.length <= maxPoints) return observations

  const step = Math.ceil(observations.length / maxPoints)
  const result: { date: string; value: number }[] = []

  for (let i = 0; i < observations.length; i += step) {
    const chunk = observations.slice(i, i + step)
    result.push(chunk[chunk.length - 1])
  }

  return result
}
