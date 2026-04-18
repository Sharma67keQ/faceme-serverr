import { Component, ErrorInfo, PropsWithChildren } from "react";
import { AppErrorState } from "@/components/app-error-state";
import { logger } from "@/utils/logger";

type RootErrorBoundaryState = {
  error: Error | null;
};

export class RootErrorBoundary extends Component<PropsWithChildren, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Root app crashed", error, info.componentStack);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <AppErrorState
          title="Faceme crashed"
          message={this.state.error.message || "An unexpected startup error blocked the app from rendering."}
          onAction={this.retry}
        />
      );
    }

    return this.props.children;
  }
}
