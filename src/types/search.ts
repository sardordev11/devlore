export interface SearchItem {
  id: string;
  title: string;
  preview: string | null;
  type: { name: string; icon: string; color: string };
}

export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

// Everything the command palette searches, loaded once with the page.
export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}
