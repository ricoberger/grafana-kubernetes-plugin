import { useSearchParams } from 'react-router-dom';

export function useActiveTab(
  defaultTab: string,
  paramName = 'tab',
): [string, (tab: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get(paramName) ?? defaultTab;

  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(paramName, tab);
        return next;
      },
      { replace: true },
    );
  };

  return [activeTab, setActiveTab];
}
