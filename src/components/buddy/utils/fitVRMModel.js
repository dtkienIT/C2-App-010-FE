import { Box3, Vector3 } from "three";
import { logModelFit } from "./debugTransform";

export function getStableModelFit(vrm, modelConfig) {
  vrm.scene.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(vrm.scene);
  const size = new Vector3();
  const center = new Vector3();

  bounds.getSize(size);
  bounds.getCenter(center);
  const measuredHeight = Math.max(size.y * (modelConfig?.scaleMultiplier ?? 1), 0.1);

  const fit = {
    center,
    height: Math.max(measuredHeight, 0.1),
    minY: bounds.min.y,
  };

  logModelFit(fit, modelConfig);

  return fit;
}
