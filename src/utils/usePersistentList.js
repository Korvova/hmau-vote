import { useState } from 'react';

// Temporary in-memory list state. No localStorage.
export default function usePersistentList(_lsKey, initial) {
  const [list, setList] = useState(initial);
  return [list, setList];
}

