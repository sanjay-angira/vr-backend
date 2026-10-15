const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const targetCount = 10;
const applyChanges = process.argv.includes("--apply");

function cleanText(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(value) {
  const text = cleanText(value);
  const sentence = text.match(/^.*?[.!?](?:\s|$)/);
  return (sentence?.[0] || text).trim();
}

function normalizeQuestion(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function detectExistingTopics(questions) {
  const topics = new Set();
  const rules = [
    ["storage", /store|storage|keep .*fresh|fresh after opening/],
    ["composition", /made from|ingredient|whole wheat|grain composition/],
    ["additives", /preservative|artificial color|additive/],
    ["spice-level", /spicy|heat level|hot is/],
    ["purity", /pure|purity/],
    ["colour", /color|colour/],
    ["aroma", /aroma|fragrance/],
    ["packaging", /packaging|sealed pack|seal/],
    ["everyday", /daily|every day|everyday/],
  ];

  for (const question of questions) {
    const normalized = normalizeQuestion(question);
    for (const [topic, pattern] of rules) {
      if (pattern.test(normalized)) topics.add(topic);
    }
  }
  return topics;
}

function getFamily(product) {
  const name = product.name.toLowerCase();
  const category = (product.category || "").toLowerCase();
  if (/\b(atta|aata|flour)\b/.test(name)) return "flour";
  if (/\boil\b/.test(name)) return "oil";
  if (/\brice\b/.test(name)) return "rice";
  if (/\b(dal|lentil|moong)\b/.test(name)) return "pulses";
  if (category.includes("spice")) {
    return /\b(whole|sabut|seed|peppercorn)\b/.test(name)
      ? "whole-spice"
      : "ground-spice";
  }
  if (category.includes("sweet") || category.includes("snack")) return "snack";
  if (/\bseed/.test(name)) return "seeds";
  if (/mix\b/.test(name)) return "dry-fruit-mix";
  if (category.includes("dry fruit")) return "dry-fruit";
  return "pantry";
}

function getUseDescription(product, family) {
  const text = cleanText(product.description);
  const match = text.match(
    /(?:perfect|ideal|great|excellent|suitable)\s+for\s+([^.!?]+)/i
  );
  if (match?.[1]) return match[1].replace(/,\s*$/, "").trim();

  const defaults = {
    flour: "rotis, chapatis, and parathas",
    oil: "everyday cooking and recipes that call for mustard oil",
    rice: "rice dishes such as pulao and biryani",
    pulses: "dals, curries, and other cooked meals",
    "whole-spice": "tempering, curries, rice dishes, and spice blends",
    "ground-spice": "seasoning curries, dals, vegetables, and other recipes",
    seeds: "snacks, breakfast bowls, salads, and recipe toppings",
    "dry-fruit-mix": "snacking and adding to breakfast or dessert recipes",
    "dry-fruit": "snacking, breakfast, sweets, and everyday recipes",
    snack: "snacking and serving alongside tea or other refreshments",
    pantry: "everyday cooking and recipes",
  };
  return defaults[family];
}

function makeFaqs(product) {
  const name = product.name;
  const family = getFamily(product);
  const intro = firstSentence(product.description);
  const use = getUseDescription(product, family);
  const questions = [];

  const add = (topic, question, answer) =>
    questions.push({ topic, question, answer });

  add(
    "identity",
    `What is ${name}?`,
    intro
      ? `${intro} For the complete product details, refer to the current pack label.`
      : `${name} is listed in ${product.category || "the grocery"} category. See the product page and current pack label for full details.`
  );
  add(
    "use",
    `How can I use ${name}?`,
    `The product listing suggests ${use}. Follow your recipe and any preparation directions printed on the pack.`
  );
  add(
    "recipes",
    `What recipes can I make with ${name}?`,
    `You can use ${name} in recipes suited to this product, including ${use}. Adjust the amount and preparation to the recipe.`
  );

  const templates = {
    flour: [
      ["kneading", `How do I prepare dough with ${name}?`, "Add water gradually while mixing and knead to the texture your recipe calls for. Follow any specific directions on the pack."],
      ["texture", `Can I use ${name} for parathas as well as rotis?`, "The product listing suggests it for common flatbreads. Use the dough and cooking method that suits your recipe."],
      ["composition", `Which grains are used in ${name}?`, "Check the ingredient list on the current pack for the exact grain composition. Product names and descriptions may not list every ingredient."],
      ["nutrition", `Where can I find the nutrition information for ${name}?`, "Refer to the nutrition panel on the current pack for serving size and nutrient values; these details should not be inferred from the product name."],
      ["sifting", `Should I sift ${name} before use?`, "Sifting is optional for many recipes and depends on the texture you prefer. Follow your recipe."],
      ["pack-size", `What pack sizes of ${name} are available?`, "Select from the pack-size options shown on this product page. Available options may change."],
      ["storage", `How should I store ${name} after opening?`, "Close the pack securely and follow its storage directions. Keep it away from moisture and use a clean, dry scoop."],
      ["additives", `Does ${name} contain additives?`, "Check the ingredient declaration on the current pack for additives and processing details."],
      ["date", `How do I check the freshness of ${name}?`, "Check the batch, packed-on, and best-before information printed on the pack, and ensure the seal is intact."],
      ["allergens", `Where can I check allergen information for ${name}?`, "Review the allergen and cross-contact statements on the current pack before use, especially when cooking for someone with a food allergy."],
      ["water", `How much water should I add to ${name}?`, "Water needs vary with the flour and recipe. Add it gradually until you reach the dough consistency your recipe requires."],
      ["uses", `Can ${name} be used for everyday cooking?`, `The listing presents ${name} for regular meal preparation. Choose recipes and portions to suit your household and follow the pack directions.`],
    ],
    oil: [
      ["cooking", `What dishes can I cook with ${name}?`, `The listing describes ${name} as a cooking oil. Use it in recipes that call for mustard oil and follow the pack's cooking guidance.`],
      ["flavour", `What flavour does ${name} add to food?`, `${intro || `The listing identifies ${name} as mustard oil.`} Taste can vary by recipe and personal preference.`],
      ["heating", `How should I use ${name} when cooking?`, "Follow the cooking instructions on the pack and the method in your recipe. Do not rely on general guidance for a product-specific heating point."],
      ["composition", `What are the ingredients in ${name}?`, "Check the current pack's ingredient declaration for the exact contents and product details."],
      ["nutrition", `Where can I find nutrition information for ${name}?`, "Refer to the nutrition panel on the current pack for serving size and nutrient values."],
      ["storage", `How should I store ${name}?`, "Keep the container tightly closed and follow the pack's storage directions. Avoid storing it near heat or direct sunlight."],
      ["packaging", `What should I check when ${name} is delivered?`, "Check that the container is sealed and undamaged. If it appears to have leaked or the seal is broken, contact the seller before using it."],
      ["pack-size", `Which pack sizes of ${name} can I order?`, "Choose from the pack-size options currently shown on this product page."],
      ["date", `Where can I find the best-before date for ${name}?`, "The batch and best-before details are printed on the pack. Check them before use."],
      ["allergens", `Does ${name} have an allergen declaration?`, "Review the allergen and cross-contact information on the current pack, and contact the seller if you need clarification."],
      ["recipes", `Can ${name} be used for tadka?`, "Use it for tadka only when it suits your recipe and the product's pack directions."],
      ["choice", `How do I know if ${name} suits my recipe?`, "Check the product description and pack label, then compare them with the oil type requested by your recipe."],
    ],
    rice: [
      ["preparation", `Should I rinse ${name} before cooking?`, "Rinsing depends on your recipe and preference. Follow the pack directions and your chosen cooking method."],
      ["soaking", `Does ${name} need to be soaked before cooking?`, "Soaking requirements vary by recipe and cooking method. Check the pack directions and follow your recipe."],
      ["dishes", `Which dishes can I make with ${name}?`, `The listing suggests ${use}. Choose a preparation method suited to the dish.`],
      ["texture", `How can I get the texture I want when cooking ${name}?`, "Follow the cooking directions on the pack and adjust liquid and cooking method to suit your recipe."],
      ["composition", `What ingredients are in ${name}?`, "Check the current pack's ingredient declaration for the exact contents."],
      ["quantity", `How much ${name} should I cook per person?`, "Portions depend on the dish and appetite. Use the serving guidance on the pack if provided, or follow your recipe."],
      ["storage", `How should I store ${name} after opening?`, "Keep it in a clean, dry, airtight container and follow the storage directions on the pack. Protect it from moisture."],
      ["pack-size", `What pack sizes of ${name} are available?`, "Available pack sizes are listed in the product options above; select the one that suits your needs."],
      ["date", `How can I check the freshness of ${name}?`, "Check the packed-on and best-before details on the pack and make sure the package is intact."],
      ["allergens", `Where can I find allergen information for ${name}?`, "Review the allergen and cross-contact statements on the current pack before serving."],
      ["cooking", `Can I use ${name} for pulao or biryani?`, "The product listing suggests rice dishes. Follow your pulao or biryani recipe and the pack's preparation directions."],
      ["leftovers", `How should I handle cooked ${name}?`, "Follow food-safety guidance for cooked rice: refrigerate leftovers promptly in a covered container and reheat thoroughly before serving."],
    ],
    pulses: [
      ["preparation", `Should I rinse ${name} before cooking?`, "Sort and rinse pulses as directed by your recipe and pack instructions before cooking."],
      ["soaking", `Does ${name} need soaking before cooking?`, "Soaking depends on the pulse and recipe. Check the pack directions and follow your preferred cooking method."],
      ["cooking", `How do I cook ${name}?`, `Use ${name} in a recipe suited to this pulse, such as ${use}. Cook it according to the pack directions until it reaches the texture you prefer.`],
      ["dishes", `What dishes can I make with ${name}?`, `The listing suggests ${use}. Follow the recipe for the preparation and seasoning.`],
      ["composition", `What is ${name} made from?`, "The exact ingredient information is printed on the current pack; refer to it for the product's composition."],
      ["quantity", `How much ${name} should I cook?`, "The amount depends on the recipe and number of servings. Use the pack's serving guidance if available."],
      ["storage", `How should I store ${name} after opening?`, "Transfer it to a clean, dry, airtight container or reseal the pack, and follow the printed storage directions."],
      ["pack-size", `Which pack sizes of ${name} can I choose?`, "Check the size options shown on this product page; availability may change."],
      ["date", `Where can I find the best-before date for ${name}?`, "Check the batch and best-before information printed on the pack before cooking."],
      ["allergens", `How can I check allergens for ${name}?`, "Read the ingredient, allergen, and cross-contact statements on the current pack."],
      ["sprouting", `Can ${name} be used for sprouting?`, "Only use it for sprouting if the pack or seller confirms it is suitable for that purpose; otherwise cook it as directed."],
      ["additives", `Does ${name} contain any additives?`, "Refer to the current pack's ingredient declaration for additives and processing details."],
    ],
    "whole-spice": [
      ["form", `Is ${name} sold whole or ground?`, "This product listing is for the whole-spice form. Check the selected pack details before ordering."],
      ["cooking", `How can I use ${name} in cooking?`, `The listing suggests ${use}. Add it at the stage specified by your recipe.`],
      ["grinding", `Can I grind ${name} at home?`, "Whole spices can be ground for recipes that call for a ground form. Grind only the amount you need and follow your recipe."],
      ["quantity", `How much ${name} should I add to a dish?`, "The amount depends on the recipe and your taste preference. Start with the quantity specified by your recipe."],
      ["flavour", `What flavour does ${name} bring to a recipe?`, `${intro || `The listing identifies ${name} as a whole spice.`} The final flavour depends on how it is used in the recipe.`],
      ["composition", `What are the ingredients in ${name}?`, "Check the current pack's ingredient declaration for the exact contents."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack or use an airtight container, and follow the printed storage directions. Keep it dry."],
      ["pack-size", `What pack sizes of ${name} are available?`, "Choose from the pack-size options shown on this product page."],
      ["date", `How do I check the freshness of ${name}?`, "Check the packed-on and best-before details on the package and confirm the seal is intact."],
      ["allergens", `Where can I check allergen information for ${name}?`, "Review the allergen and cross-contact statements on the current pack."],
      ["blend", `Can ${name} be used in spice blends?`, `You can include ${name} in a blend when your recipe calls for this spice. Adjust the quantity to the recipe.`],
      ["additives", `Does ${name} contain added ingredients?`, "The pack's ingredient declaration is the reliable source for added ingredients and processing details."],
    ],
    "ground-spice": [
      ["form", `Is ${name} already ground?`, "This listing is for the powdered or blended form named on the product page. Check the pack label for its exact contents."],
      ["cooking", `When should I add ${name} while cooking?`, "Add it at the stage specified by your recipe and follow any preparation guidance on the pack."],
      ["quantity", `How much ${name} should I use?`, "The right amount varies by recipe and taste preference. Follow your recipe and adjust gradually."],
      ["flavour", `What flavour does ${name} add to food?`, `${intro || `The product listing identifies ${name} as a cooking spice.`} Taste and intensity depend on the recipe and quantity used.`],
      ["dishes", `Which dishes can I season with ${name}?`, `The product listing suggests ${use}. Use it in recipes that call for this spice.`],
      ["composition", `What are the ingredients in ${name}?`, "For a single spice or blend, check the current pack's ingredient declaration for exact composition."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack or use a clean, dry airtight container, and follow the printed storage directions."],
      ["pack-size", `Which pack sizes of ${name} are available?`, "Check the available pack-size options shown on this product page."],
      ["date", `Where can I find the best-before date for ${name}?`, "The packed-on and best-before details are printed on the package. Check them before use."],
      ["allergens", `Does ${name} have allergen or cross-contact information?`, "Read the current pack's allergen and cross-contact statements before use."],
      ["blend", `Can I combine ${name} with other spices?`, "You can combine it with other spices when your recipe calls for a blend. Check each ingredient label if you have dietary restrictions."],
      ["quality", `How can I keep ${name} aromatic?`, "Keep the pack tightly closed, dry, and stored according to its label. Use a clean, dry spoon."],
    ],
    seeds: [
      ["serving", `How can I serve ${name}?`, `The listing suggests ${use}. Add it to dishes in the way your recipe recommends.`],
      ["recipes", `Can I add ${name} to breakfast or salads?`, "Use it as a topping when it suits your recipe, and check the pack for any preparation directions."],
      ["preparation", `Does ${name} need preparation before eating?`, "Check the product label for whether it should be eaten as packed or prepared first."],
      ["taste", `What does ${name} taste like?`, `${intro || `The product listing describes ${name}.`} Taste and texture can vary by serving method.`],
      ["composition", `What ingredients are in ${name}?`, "Check the ingredient declaration on the current pack for exact contents."],
      ["allergens", `Where can I find allergen details for ${name}?`, "Review the allergen and cross-contact statements on the current pack before serving."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack or use an airtight container and follow the package storage directions. Keep it away from moisture."],
      ["pack-size", `What pack sizes of ${name} are available?`, "See the pack-size choices on the product page and select the option you need."],
      ["date", `How do I check the freshness of ${name}?`, "Check the package seal and the printed packed-on and best-before details."],
      ["diet", `How can I check if ${name} fits my diet?`, "Use the current pack's ingredient and nutrition panels to check whether it suits your dietary needs."],
      ["roasting", `Can I toast ${name} before serving?`, "Toast it only if your recipe calls for it, and follow the recipe's method."],
      ["additives", `Does ${name} contain any added ingredients?`, "Refer to the current pack's ingredient declaration for additives and processing details."],
    ],
    "dry-fruit-mix": [
      ["serving", `How can I enjoy ${name}?`, `The listing suggests ${use}. Serve it as a snack or use it in a recipe that suits the mix.`],
      ["composition", `Which ingredients are included in ${name}?`, "The exact mix and ingredient proportions are listed on the current pack; check the ingredient declaration before ordering or serving."],
      ["recipes", `Can I add ${name} to breakfast or desserts?`, "You can use the mix as a topping or ingredient when it suits your recipe. Check the pack for preparation guidance."],
      ["taste", `What taste and texture should I expect from ${name}?`, `${intro || `The listing describes ${name} as a dry fruit mix.`} The exact combination is shown on the product pack.`],
      ["allergens", `How do I check allergens in ${name}?`, "Review the full ingredient, allergen, and cross-contact statements on the current pack; mixed products may include several ingredients."],
      ["diet", `How can I tell if ${name} suits my dietary needs?`, "Check the ingredient list and nutrition panel on the current pack. Ask a qualified professional if you need dietary advice."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack or transfer it to a clean airtight container, and follow the package storage directions."],
      ["pack-size", `What pack sizes of ${name} can I order?`, "Select from the pack-size options currently listed on this product page."],
      ["date", `How can I check the freshness of ${name}?`, "Check the package seal and the printed packed-on and best-before details."],
      ["serving-size", `How much ${name} should I serve?`, "Serving amounts depend on personal preference and the recipe. Refer to the nutrition panel for serving information."],
      ["additives", `Does ${name} contain added ingredients?`, "Check the current pack's ingredient declaration for added ingredients and processing details."],
      ["gifting", `Can ${name} be served to guests?`, "It can be offered as a snack where the ingredients suit your guests. Check the pack's allergen details before serving."],
    ],
    "dry-fruit": [
      ["serving", `How can I enjoy ${name}?`, `The listing suggests ${use}. It can be served as a snack or used in recipes that call for this product.`],
      ["recipes", `Can I use ${name} in breakfast or dessert recipes?`, "Use it as an ingredient or topping when it suits your recipe. Check the pack for any preparation instructions."],
      ["preparation", `Does ${name} need to be soaked or cooked first?`, "Preparation depends on your recipe and preference. Check the pack and follow the recipe; soaking is not required unless your recipe calls for it."],
      ["taste", `What taste or texture does ${name} have?`, `${intro || `The listing describes ${name}.`} Serving method and recipe can affect the eating experience.`],
      ["composition", `What ingredients are in ${name}?`, "Check the current pack's ingredient declaration for exact contents."],
      ["allergens", `Where can I find allergen information for ${name}?`, "Read the allergen and cross-contact statements on the current pack before serving, especially when cooking for others."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack or use a clean, airtight container and follow the package storage directions."],
      ["pack-size", `Which pack sizes of ${name} are available?`, "Choose from the pack-size options currently shown on this product page."],
      ["date", `How do I check the freshness of ${name}?`, "Check the seal and the packed-on and best-before information printed on the pack."],
      ["diet", `How do I check whether ${name} fits my diet?`, "Review the ingredient and nutrition panels on the current pack for information relevant to your diet."],
      ["serving-size", `How much ${name} should I serve?`, "Serving amounts depend on personal preference and the recipe. Use the pack's nutrition panel for serving information."],
      ["additives", `Does ${name} contain preservatives or other additives?`, "Refer to the ingredient declaration on the current pack for preservatives and other processing details."],
    ],
    snack: [
      ["serving", `How can I serve ${name}?`, `The listing suggests ${use}. Check the pack for serving or preparation directions.`],
      ["flavour", `What flavour should I expect from ${name}?`, `${intro || `The product listing describes ${name}.`} The pack label has the most complete product and flavour information.`],
      ["ready-to-eat", `Is ${name} ready to eat?`, "Follow the preparation and serving directions printed on the current pack."],
      ["occasion", `When can I serve ${name}?`, "Serve it as a snack or alongside refreshments when its ingredients suit the people eating it."],
      ["composition", `What ingredients are used in ${name}?`, "Check the ingredient declaration on the current pack for the full composition."],
      ["allergens", `How can I check allergens in ${name}?`, "Read the allergen and cross-contact statements on the current pack before serving."],
      ["diet", `How do I check if ${name} suits my diet?`, "Refer to the current pack's ingredient and nutrition panels for dietary information."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the pack promptly and follow the printed storage directions to help maintain its quality."],
      ["pack-size", `What pack sizes of ${name} are available?`, "See the pack-size options on the product page and select the available option you prefer."],
      ["date", `Where can I find the best-before date for ${name}?`, "Check the batch and best-before details printed on the pack and confirm the seal is intact."],
      ["spice-level", `How spicy is ${name}?`, "The product description or pack label describes its seasoning. Spice intensity is subjective, so review the ingredients before choosing."],
      ["shipping", `What should I do if ${name} arrives damaged?`, "Check the seal and package on delivery. If it is damaged or open, contact customer support before consuming it."],
    ],
    pantry: [
      ["identity", `What is ${name}?`, intro || `${name} is listed in ${product.category || "the grocery"} category. Check the product page and pack for full details.`],
      ["use", `How can I use ${name}?`, `The product listing suggests ${use}. Follow the recipe and package directions.`],
      ["preparation", `How should I prepare ${name}?`, "Preparation depends on the recipe. Follow the directions on the pack and your chosen recipe."],
      ["composition", `What are the ingredients in ${name}?`, "Refer to the ingredient declaration on the current pack for the exact contents."],
      ["allergens", `Where can I check allergens for ${name}?`, "Review the allergen and cross-contact statements on the current pack."],
      ["storage", `How should I store ${name} after opening?`, "Reseal the product and follow the storage directions printed on its pack."],
      ["pack-size", `Which pack sizes of ${name} are available?`, "Check the options shown on this product page for currently available sizes."],
      ["date", `How can I check the freshness of ${name}?`, "Check the package seal and the printed packed-on and best-before details."],
      ["nutrition", `Where can I find nutrition details for ${name}?`, "Refer to the nutrition panel on the current pack for serving size and nutrient values."],
      ["quality", `What should I check when ${name} is delivered?`, "Check the product name, selected pack size, package condition, and seal when your order arrives."],
      ["additives", `Does ${name} contain additives?`, "Check the current pack's ingredient declaration for additives and processing details."],
      ["recipes", `What recipes can I use ${name} in?`, `The listing suggests ${use}. Follow recipes that call for this product.`],
    ],
  };

  const familyFaqs = (templates[family] || templates.pantry).map(
    ([topic, question, answer]) => ({ topic, question, answer })
  );
  return [...questions, ...familyFaqs];
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('ensure-product-faqs-v1'))"
    );

    const { rows: products } = await client.query(
      `SELECT p.id, trim(p."productName") AS name,
              p."shortDescription", p.description,
              trim(c."categoryName") AS category
       FROM product p
       LEFT JOIN categories c ON c.id = p."categoryId"
       WHERE p."isActive" = true AND p."publishStatus" = 'published'
       ORDER BY p.id
       FOR UPDATE OF p`
    );

    const productIds = products.map((product) => product.id);
    if (!productIds.length) {
      throw new Error("No active, published products were found.");
    }

    const { rows: existingFaqs } = await client.query(
      `SELECT id, "productId", question, "sortOrder", "isActive"
       FROM faqs
       WHERE "productId" = ANY($1::int[])
       ORDER BY "productId", "sortOrder", id`,
      [productIds]
    );

    const faqsByProduct = new Map();
    for (const product of products) faqsByProduct.set(product.id, []);
    for (const faq of existingFaqs) {
      faqsByProduct.get(faq.productId)?.push(faq);
    }

    const inserts = [];
    const summaries = [];

    for (const product of products) {
      const productFaqs = faqsByProduct.get(product.id) || [];
      const activeFaqs = productFaqs.filter((faq) => faq.isActive);
      const needed = Math.max(0, targetCount - activeFaqs.length);
      if (needed === 0) {
        summaries.push({
          id: product.id,
          name: product.name,
          existingActive: activeFaqs.length,
          added: 0,
        });
        continue;
      }

      const existingQuestions = new Set(
        activeFaqs.map((faq) => normalizeQuestion(faq.question))
      );
      const existingTopics = detectExistingTopics(
        activeFaqs.map((faq) => faq.question)
      );
      const usedTopics = new Set(existingTopics);
      const candidates = makeFaqs({
        ...product,
        description: product.shortDescription || product.description,
      });
      const selected = [];

      for (const candidate of candidates) {
        const normalized = normalizeQuestion(candidate.question);
        if (
          existingQuestions.has(normalized) ||
          usedTopics.has(candidate.topic)
        ) {
          continue;
        }
        selected.push(candidate);
        existingQuestions.add(normalized);
        usedTopics.add(candidate.topic);
        if (selected.length === needed) break;
      }

      if (selected.length !== needed) {
        throw new Error(
          `Not enough unique FAQ content for product ${product.id} (${product.name}): needed ${needed}, found ${selected.length}; candidates: ${candidates.map((faq) => faq.topic).join(", ")}; existing topics: ${[...existingTopics].join(", ")}.`
        );
      }

      const maxSortOrder = productFaqs.reduce(
        (max, faq) => Math.max(max, Number(faq.sortOrder) || 0),
        0
      );
      selected.forEach((faq, index) => {
        inserts.push({
          ...faq,
          productId: product.id,
          sortOrder: maxSortOrder + index + 1,
        });
      });
      summaries.push({
        id: product.id,
        name: product.name,
        existingActive: activeFaqs.length,
        added: selected.length,
      });
    }

    const totalToInsert = inserts.length;
    if (applyChanges) {
      for (const faq of inserts) {
        await client.query(
          `INSERT INTO faqs (question, answer, "sortOrder", "isActive", "productId")
           VALUES ($1, $2, $3, true, $4)`,
          [faq.question, faq.answer, faq.sortOrder, faq.productId]
        );
      }

      const { rows: verification } = await client.query(
        `SELECT p.id, COUNT(f.id) FILTER (WHERE f."isActive" = true)::int AS count
         FROM product p
         LEFT JOIN faqs f ON f."productId" = p.id
         WHERE p.id = ANY($1::int[])
         GROUP BY p.id`,
        [productIds]
      );
      const incorrect = verification.filter(
        (row) => row.count !== Math.max(
          targetCount,
          (faqsByProduct.get(row.id) || []).filter((faq) => faq.isActive).length
        )
      );
      if (incorrect.length) {
        throw new Error(
          `FAQ count verification failed for product IDs: ${incorrect.map((row) => row.id).join(", ")}`
        );
      }
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }

    console.log(
      JSON.stringify(
        {
          mode: applyChanges ? "applied" : "dry-run",
          products: products.length,
          faqRecordsToAdd: totalToInsert,
          productsReachingAtLeastTen: summaries.filter(
            (summary) =>
              summary.existingActive + summary.added >= targetCount
          ).length,
          results: summaries,
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`FAQ update failed: ${error.message}`);
  process.exitCode = 1;
});
