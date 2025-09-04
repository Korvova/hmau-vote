import { useEffect, useState } from 'react';

export default function usePersistentList(lsKey, initial) {
  const [list, setList] = useState(initial);

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setList(parsed);
      }
    } catch {}
  }, [lsKey]);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(lsKey, JSON.stringify(list));
    } catch {}
  }, [lsKey, list]);

  return [list, setList];
}
