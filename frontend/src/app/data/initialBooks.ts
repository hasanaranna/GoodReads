export interface Book {
  id: string;
  title: string;
  titleLocal?: string;
  author: string;
  coverUrl: string;
  rating: number; // 0-5
  shelf: 'read' | 'currently-reading' | 'want-to-read';
  dateAdded: string;
  dateRead?: string;
  review?: string;
  pagesCompleted?: number;
  totalPages?: number;
}

export const initialBooks: Book[] = [
  {
    id: '1',
    title: 'Aparajito',
    titleLocal: 'অপরাজিত',
    author: 'Bibhutibhushan Bandyopadhyay',
    coverUrl:
      'https://images.unsplash.com/photo-1676747484510-755c231ae83e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 5,
    shelf: 'read',
    dateAdded: 'March 25 2023',
    dateRead: 'May 12 2023',
    review: 'Excellent book!!!',
    totalPages: 320,
    pagesCompleted: 320,
  },
  {
    id: '2',
    title: 'Pather Panchali',
    author: 'Bibhutibhushan Bandyopadhyay',
    coverUrl:
      'https://images.unsplash.com/photo-1755541608494-5c02cf56e1f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 5,
    shelf: 'read',
    dateAdded: 'March 25 2023',
    dateRead: 'May 12 2023',
    review: '',
    totalPages: 280,
    pagesCompleted: 280,
  },
  {
    id: '3',
    title: 'Durbin',
    titleLocal: 'দুরবীন',
    author: 'Shirshendu Mukhopadhyay',
    coverUrl:
      'https://images.unsplash.com/photo-1772976811682-465df3b8c735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 5,
    shelf: 'read',
    dateAdded: 'March 25 2023',
    dateRead: 'May 12 2023',
    review: '',
    totalPages: 240,
    pagesCompleted: 240,
  },
  {
    id: '4',
    title: 'Brishti Bilas',
    titleLocal: 'বৃষ্টি বিলাস',
    author: 'Humayun Ahmed',
    coverUrl:
      'https://images.unsplash.com/photo-1727044113262-b96af5546da2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 5,
    shelf: 'read',
    dateAdded: 'March 25 2023',
    dateRead: 'May 12 2023',
    review: '',
    totalPages: 180,
    pagesCompleted: 180,
  },
  {
    id: '5',
    title: 'The Hard Things About Hard Things',
    author: 'Ben Horowitz',
    coverUrl:
      'https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 3,
    shelf: 'currently-reading',
    dateAdded: 'March 25 2023',
    review: '',
    totalPages: 200,
    pagesCompleted: 50,
  },
  {
    id: '6',
    title: 'Educated',
    author: 'Tara Westover',
    coverUrl:
      'https://images.unsplash.com/photo-1735050873394-5f07cca72d70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 0,
    shelf: 'want-to-read',
    dateAdded: 'March 25 2023',
    totalPages: 352,
    pagesCompleted: 0,
  },
  {
    id: '7',
    title: 'The Glass Castle',
    author: 'Jeannette Walls',
    coverUrl:
      'https://images.unsplash.com/photo-1755541608494-5c02cf56e1f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 0,
    shelf: 'want-to-read',
    dateAdded: 'March 25 2023',
    totalPages: 288,
    pagesCompleted: 0,
  },
];
