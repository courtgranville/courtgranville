// ModelBoundary - a tiny React error boundary shared by the two R3F model
// islands (WorkGallery + ProjectModel). useGLTF *suspends* while a GLB decodes,
// so a failed or aborted fetch throws past <Suspense fallback={null}> rather
// than landing in it - leaving the cell's loading skeleton pulsing forever
// (onReady never fires) or the project-page stage stuck blank. Wrapping the
// suspending subtree in this boundary catches that throw and lets the caller
// resolve to a clean, quiet absence instead of a stuck stage.
//
// On-brand fallback (per the design rules): nothing decorative - just render
// `fallback` (null by default) and notify via `onError` so the caller can fade
// its skeleton / collapse the stage.

import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  // Rendered in place of the children once a descendant throws. Default: null
  // (quiet absence - the editorial caption / link around it stays usable).
  fallback?: ReactNode;
  // Fired once when the boundary catches, so the caller can release any
  // loading state it was holding open (e.g. fade the skeleton out).
  onError?: () => void;
};
type State = { failed: boolean };

export default class ModelBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
