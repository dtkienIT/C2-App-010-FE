import { AnimationClip } from "three";

export function sanitizeVRMClip(clip) {
  const sanitizedTracks = clip.tracks.flatMap((track) => {
    if (track.name.endsWith(".scale")) {
      return [];
    }

    if (track.name.endsWith(".position")) {
      return [];
    }

    return [track.clone()];
  });

  return new AnimationClip(`${clip.name}_sanitized`, clip.duration, sanitizedTracks);
}
