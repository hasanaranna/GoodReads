function pickCoverImage(imageLinks = {}) {
  return (
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    null
  );
}

function extractISBN(industryIdentifiers = []) {
  if (!Array.isArray(industryIdentifiers)) return null;
  const isbn13 = industryIdentifiers.find((i) => i.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = industryIdentifiers.find((i) => i.type === "ISBN_10");
  if (isbn10) return isbn10.identifier;
  return null;
}

export function formatBook(item = {}) {
  const volumeInfo = item.volumeInfo || {};
  const saleInfo = item.saleInfo || {};
  return {
    id: item.id || null,
    googleBooksId: item.id || null,
    title: volumeInfo.title || "Untitled",
    subtitle: volumeInfo.subtitle || null,
    authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
    description: volumeInfo.description || null,
    publisher: volumeInfo.publisher || null,
    publishedDate: volumeInfo.publishedDate || null,
    pageCount:
      typeof volumeInfo.pageCount === "number" ? volumeInfo.pageCount : null,
    genres: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
    isbn: extractISBN(volumeInfo.industryIdentifiers),
    language: volumeInfo.language || null,
    alternateTitles: [],
    maturityRating: volumeInfo.maturityRating || null,
    averageRating:
      typeof volumeInfo.averageRating === "number"
        ? volumeInfo.averageRating
        : null,
    ratingsCount:
      typeof volumeInfo.ratingsCount === "number" ? volumeInfo.ratingsCount : 0,
    coverImage: pickCoverImage(volumeInfo.imageLinks),
    previewLink: volumeInfo.previewLink || null,
    infoLink: volumeInfo.infoLink || null,
    canonicalVolumeLink: volumeInfo.canonicalVolumeLink || null,
    ebookAvailable: Boolean(saleInfo.isEbook),
  };
}
