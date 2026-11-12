// Pendulum physics for a hanging Snooze, shared by every screen where Snooze hangs from the branch.
// Runs every frame on the UI thread. Tilt comes from the phone's roll angle; drag pushes the swing.
import {
  SensorType,
  useAnimatedSensor,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { usePanGesture } from 'react-native-gesture-handler';

// ---- feel knobs ----
export const TILT_SIGN = 1;                 // flip to -1 if Snooze swings the wrong way on your phone
const DEAD_ZONE = (3 * Math.PI) / 180;      // ignore ~3 degrees of hand wobble
const MAX_TILT = 0.85;                      // radians: furthest Snooze will lean from tilt alone
const STIFFNESS = 9;                        // pendulum pull back to "down" (higher = faster swing)
const DAMPING = 0.55;                       // air drag (higher = settles sooner)
const LEVEL_FOLLOW_S = 10;                  // "level" slowly follows how you hold the phone over ~10 s
export const MAX_SWING = 0.95;              // radians: never swings past this (about 55 degrees)
const DRAG_PX_PER_RAD = 260;                // finger travel for one radian of swing

export function useSwing() {
  const theta = useSharedValue(0);      // swing angle, 0 = hanging straight down
  const omega = useSharedValue(0);      // angular velocity
  const capPhi = useSharedValue(0);     // cap wobble relative to the body
  const capOmega = useSharedValue(0);
  const tilt = useSharedValue(0);       // eased tilt target
  const level = useSharedValue<number | null>(null);
  const dragging = useSharedValue(false);
  const dragStart = useSharedValue(0);
  const time = useSharedValue(0);

  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    time.value += dt;

    // Tilt from the phone's roll angle, not raw sensor numbers, so it works upright or lying in bed.
    const g = gravity.sensor.value;
    const roll = Math.atan2(g.x, Math.sqrt(g.y * g.y + g.z * g.z));
    if (level.value === null) level.value = roll;
    level.value += (roll - level.value) * Math.min(1, dt / LEVEL_FOLLOW_S);
    let d = (roll - (level.value as number)) * TILT_SIGN;
    d = Math.sign(d) * Math.max(0, Math.abs(d) - DEAD_ZONE);
    const target = Math.max(-MAX_TILT, Math.min(MAX_TILT, d * 1.6));
    tilt.value += (target - tilt.value) * Math.min(1, dt * 4); // ease in, never snap

    if (!dragging.value) {
      const alpha = -STIFFNESS * Math.sin(theta.value - tilt.value) - DAMPING * omega.value;
      omega.value += alpha * dt;
      theta.value += omega.value * dt;
      if (Math.abs(theta.value) > MAX_SWING) {
        theta.value = Math.sign(theta.value) * MAX_SWING;
        omega.value *= -0.35; // soft bump at the end of the swing
      }
    }

    // Cap: a stiff little spring that lags behind the body's motion.
    const capAlpha = -40 * capPhi.value - 5 * capOmega.value - omega.value * 6;
    capOmega.value += capAlpha * dt;
    capPhi.value += capOmega.value * dt;
  });

  const pan = usePanGesture({
    minDistance: 4,
    onActivate: () => {
      'worklet';
      dragging.value = true;
      dragStart.value = theta.value;
    },
    onUpdate: (e) => {
      'worklet';
      const next = Math.max(-MAX_SWING, Math.min(MAX_SWING, dragStart.value - e.translationX / DRAG_PX_PER_RAD));
      omega.value = (next - theta.value) / 0.016;
      theta.value = next;
    },
    onDeactivate: (e) => {
      'worklet';
      dragging.value = false;
      omega.value = Math.max(-4, Math.min(4, -e.velocityX / DRAG_PX_PER_RAD));
    },
  });

  return { theta, omega, capPhi, time, pan };
}

export type Swing = ReturnType<typeof useSwing>;
