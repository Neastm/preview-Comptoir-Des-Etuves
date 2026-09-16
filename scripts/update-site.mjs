import fs from 'node:fs';
import path from 'node:path';

const cats = ['wraps', 'sandwichs-chauds', 'tacos', 'burgers', 'salades', 'americains', 'assiettes', 'boissons', 'desserts'];
const locales = ['fr', 'en', 'es'];
const labels = {
  fr: ['Wraps', 'Sandwichs chauds', 'Tacos', 'Burgers', 'Salades', 'Américains', 'Assiettes', 'Boissons', 'Desserts'],
  en: ['Wraps', 'Hot sandwiches', 'Tacos', 'Burgers', 'Salads', 'American sandwiches', 'Plates', 'Drinks', 'Desserts'],
  es: ['Wraps', 'Bocadillos calientes', 'Tacos', 'Hamburguesas', 'Ensaladas', 'Americanos', 'Platos', 'Bebidas', 'Postres']
};
const intros = {
  fr: ['Nos wraps généreux : poulet, kebab, légumes et fromages, à découvrir au centre de Montpellier.', 'Nos sandwichs chauds en baguette : des garnitures généreuses et les prix de chaque formule.', 'Nos tacos français : choisissez le nombre de viandes et découvrez les garnitures disponibles.', 'Nos burgers : pain brioché, recettes gourmandes et formules avec frites et boisson.', 'Nos salades composées : découvrez les ingrédients et les formules boisson et dessert.', 'Nos américains : des sandwichs en baguette garnis de viande et de frites.', 'Nos assiettes : steak, tenders ou kebab, avec leurs accompagnements.', 'Boissons chaudes, fraîches et alcoolisées : tous les formats et prix de notre carte.', 'Crêpes, gaufres, pâtisseries et glaces : les douceurs du Comptoir et leurs prix.'],
  en: ['Generously filled wraps with chicken, kebab, vegetables and cheese in central Montpellier.', 'Hot baguette sandwiches: discover our fillings and the prices of each meal deal.', 'French tacos: choose your number of meats and explore the available fillings.', 'Brioche-bun burgers, indulgent recipes and meal deals with fries and a drink.', 'Fresh mixed salads: explore the ingredients and drink-and-dessert meal deals.', 'American-style baguette sandwiches filled with meat and fries.', 'Steak, chicken tenders or kebab plates, with their sides.', 'Hot, cold and alcoholic drinks: browse all sizes and prices.', 'Crêpes, waffles, cakes and ice cream: discover our desserts and prices.'],
  es: ['Wraps generosos de pollo, kebab, verduras y queso en el centro de Montpellier.', 'Bocadillos calientes en baguette: descubre los ingredientes y los precios de cada menú.', 'Tacos franceses: elige el número de carnes y descubre los ingredientes disponibles.', 'Hamburguesas en pan brioche y menús con patatas y bebida.', 'Ensaladas variadas: consulta los ingredientes y los menús con bebida y postre.', 'Bocadillos americanos en baguette, rellenos de carne y patatas fritas.', 'Platos de carne, tenders de pollo o kebab con sus guarniciones.', 'Bebidas calientes, frías y alcohólicas: todos los formatos y precios.', 'Crêpes, gofres, pasteles y helados: descubre nuestros postres y precios.']
};
const origin = 'https://comptoir-des-etuves.com/';
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s.trimEnd() + '\n');
const localFile = (lang, name) => lang === 'fr' ? name : `${lang}/${name}`;
const homes = Object.fromEntries(locales.map(lang => [lang, read(localFile(lang, 'index.html'))]));
const schemas = [...homes.fr.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));

function footer(lang, page) {
  const file = localFile(lang, page);
  const linkTo = target => path.posix.relative(path.posix.dirname(file), target);
  const langs = locales.map(l => `<a href="${linkTo(localFile(l, page))}${l === 'fr' ? '?lang=fr' : ''}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join(' · ');
  const caption = {fr: 'Nos spécialités', en: 'Our specialities', es: 'Nuestras especialidades'}[lang];
  return `<nav class="footer-categories" aria-label="${caption}">${cats.map((c, i) => `<a href="${c}.html">${labels[lang][i]}</a>`).join('\n')}</nav>\n    <nav class="footer-languages" aria-label="Language / Langue / Idioma">${langs}</nav>`;
}

for (const lang of locales) {
  const file = localFile(lang, 'index.html');
  let html = homes[lang];
  const existingSchema = JSON.parse([...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)][0][1]);
  const restaurant = structuredClone(schemas[0]);
  const base = origin + (lang === 'fr' ? '' : `${lang}/`);
  restaurant.url = base;
  restaurant.description = existingSchema.description;
  restaurant.areaServed = existingSchema.areaServed;
  restaurant.servesCuisine = existingSchema.servesCuisine;
  restaurant.inLanguage = lang;
  restaurant.menu = base + '#menu';
  restaurant.hasMenu['@id'] = base + '#menu';
  restaurant.hasMenu.url = base + '#menu';
  restaurant.hasMenu.name = {fr: 'Carte du Comptoir des Étuves', en: 'Le Comptoir des Étuves menu', es: 'Carta de Le Comptoir des Étuves'}[lang];
  restaurant.hasMenu.hasMenuSection.forEach((s, i) => {s.name = labels[lang][i]; s.url = base + cats[i] + '.html';});
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  html = html.replace('</head>', `${[restaurant, schemas[1]].map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n')}\n</head>`);
  if (!html.includes('footer-languages')) html = html.replace('</footer>', `    ${footer(lang, 'index.html')}\n  </footer>`);
  write(file, html);

  const header = html.match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
  const menu = html.match(/<nav class="site-menu"[\s\S]*?<\/nav>/)[0];
  for (const [i, cat] of cats.entries()) {
    const categoryFile = localFile(lang, `${cat}.html`);
    let category = read(categoryFile);
    const homeHref = `index.html${lang === 'fr' ? '?lang=fr' : ''}`;
    const remap = markup => markup.replace(/href="#([^"]+)"/g, (_, id) => `href="${cats.includes(id) ? `${id}.html` : homeHref + (id === 'top' ? '' : '#' + id)}"`);
    category = category.replace(/<header class="topbar">[\s\S]*?<\/header>/, remap(header));
    category = category.replace(/<nav class="site-menu"[\s\S]*?<\/nav>/, remap(menu));
    category = category.replace('<body class="product-page">', '<body class="product-page home category-page">');
    category = category.replace(/(<section class="product-hero[^>]*><div><h1>[\s\S]*?<\/h1>)[\s\S]*?(<\/div><\/section>)/, `$1<p class="category-intro">${intros[lang][i]}</p>$2`);
    category = category.replace(/<img\b(?![^>]*loading=)([^>]*src="[^>]*)(\/?>)/g, '<img loading="lazy" decoding="async"$1$2');
    const homeLabel = {fr: 'Voir notre carte', en: 'View our menu', es: 'Ver nuestra carta'}[lang];
    if (!category.includes('footer-languages')) category = category.replace(/\s*<script src="(?:\.\.\/)?script.js"><\/script>/, `\n  <footer class="site-footer"><p>Le Comptoir des Étuves — Montpellier</p><a href="${homeHref}#menu">${homeLabel}</a>\n${footer(lang, `${cat}.html`)}\n</footer>\n  $&`);
    write(categoryFile, category);
  }
}

write('sitemap.xml', read('sitemap.xml').replace(/<lastmod>[^<]*<\/lastmod>/g, '<lastmod>2026-09-16</lastmod>'));
