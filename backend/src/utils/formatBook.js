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

export function formatBook(item = {}) {
  const volumeInfo = item.volumeInfo || {};
  const saleInfo = item.saleInfo || {};
  // //print the item to see the structure of the data
  // console.log("Raw book item:", item);
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
    categories: Array.isArray(volumeInfo.categories)
      ? volumeInfo.categories
      : [],
    averageRating:
      typeof volumeInfo.averageRating === "number"
        ? volumeInfo.averageRating
        : null,
    ratingsCount:
      typeof volumeInfo.ratingsCount === "number" ? volumeInfo.ratingsCount : 0,
    language: volumeInfo.language || null,
    maturityRating: volumeInfo.maturityRating || null,
    coverImage: pickCoverImage(volumeInfo.imageLinks),
    previewLink: volumeInfo.previewLink || null,
    infoLink: volumeInfo.infoLink || null,
    canonicalVolumeLink: volumeInfo.canonicalVolumeLink || null,
    ebookAvailable: Boolean(saleInfo.isEbook),
  };
}
