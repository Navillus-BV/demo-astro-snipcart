let allMenus;
export async function loadMenu(id) {
  allMenus = allMenus || import.meta.glob("../data/menus/*.json");

  const path = `../data/menus/${id}.json`;

  if (!path in allMenus) {
    return;
  }

  const result = await allMenus[path]();

  const { categories, ...menu } = result.default;

  return {
    ...menu,
    slug: id,
    categories: await Promise.all(categories.map(loadCategory)),
  };
}

let allCategories;
async function loadCategory(id) {
  allCategories =
    allCategories || import.meta.glob("../data/categories/*.json");

  const path = `../data/categories/${id}.json`;

  if (!path in allCategories) {
    return;
  }

  const result = await allCategories[path]();

  const { items, ...category } = result.default;

  return {
    ...category,
    slug: id,
    items: await Promise.all(items.map(loadItem)),
  };
}

let allItems;
async function loadItem(id) {
  allItems = allItems || import.meta.glob("../data/items/*.json");

  const path = `../data/items/${id}.json`;

  if (!path in allItems) {
    return;
  }

  const { default: item } = await allItems[path]();

  return {
    ...item,
    slug: id,
    modifiers: await Promise.all((item.modifiers || []).map(loadModifier)),
  };
}

let allModifiers;
async function loadModifier(id) {
  allModifiers = allModifiers || import.meta.glob("../data/modifiers/*.json");

  const path = `../data/modifiers/${id}.json`;

  if (!path in allModifiers) {
    return;
  }

  const { default: modifier } = await allModifiers[path]();

  return {
    ...modifier,
    slug: id,
  };
}
