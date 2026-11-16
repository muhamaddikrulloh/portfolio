import React, { Suspense, lazy, type ComponentType } from "react";

type DynamicOptions = {
  ssr?: boolean;
  loading?: ComponentType;
};

export default function dynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: DynamicOptions
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const mod = await loader();
    return "default" in mod ? mod : { default: mod };
  });

  const Fallback = options?.loading;

  return function DynamicWrapper(props: P) {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
