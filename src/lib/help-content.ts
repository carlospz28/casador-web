// Textos de las páginas de ayuda. Revise los corchetes y, para los textos legales,
// pídale a un abogado que los revise antes de publicar.
import { site } from "./site";

export type HelpPage = {
  slug: string;
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  inFooter: boolean;
};

export const HELP_PAGES: HelpPage[] = [
  {
    slug: "envios",
    title: "Envíos",
    intro: `Enviamos a todo Colombia desde ${site.city}. El pedido llega en ${site.shippingDays} según tu ciudad.`,
    inFooter: true,
    sections: [
      {
        heading: "Tiempos y costo",
        paragraphs: [
          "Despachamos en [X] días hábiles después de confirmar el pago. Las piezas personalizadas tardan [X] días adicionales.",
          "Costo de envío: [valor o regla]. Lo ves antes de pagar, en el resumen del pedido.",
        ],
      },
      {
        heading: "Seguimiento",
        paragraphs: [
          "Cuando despachamos, te enviamos por WhatsApp o correo el número de guía y la transportadora para que sigas tu pedido.",
        ],
      },
    ],
  },
  {
    slug: "cambios-y-retracto",
    title: "Cambios y retracto",
    intro:
      "Si compraste en línea, puedes arrepentirte de la compra (derecho de retracto) según el Estatuto del Consumidor, Ley 1480 de 2011.",
    inFooter: true,
    sections: [
      {
        heading: "Derecho de retracto",
        paragraphs: [
          "Tienes 5 días hábiles desde que recibes el producto para retractarte. La pieza debe estar sin uso y en su empaque original.",
          "Escríbenos por WhatsApp o al correo [correo] con tu número de pedido. Te devolvemos el dinero por el mismo medio de pago en un plazo máximo de 30 días calendario.",
          "Las piezas hechas a tu medida o con tus especificaciones (personalizadas) no tienen derecho de retracto.",
        ],
      },
      {
        heading: "Cambios de talla o color",
        paragraphs: ["[Explique si acepta cambios, en qué plazo y quién paga el envío.]"],
      },
      {
        heading: "Reversión del pago",
        paragraphs: [
          "Si pagaste con tarjeta, PSE u otro medio electrónico y fuiste víctima de fraude, la operación no fue solicitada, el producto no llegó o no corresponde a lo pedido, puedes solicitar la reversión del pago. Debes avisarnos y avisar a tu banco dentro de los 5 días hábiles siguientes a enterarte.",
        ],
      },
    ],
  },
  {
    slug: "garantia",
    title: "Garantía",
    intro: `${site.warrantyText} desde la entrega.`,
    inFooter: true,
    sections: [
      {
        heading: "Qué cubre",
        paragraphs: ["[Ej.: cordón que se suelta o se rompe por defecto de tejido, cierre que no ajusta.]"],
      },
      {
        heading: "Qué no cubre",
        paragraphs: ["[Ej.: desgaste normal del cordón, daño por golpes, pérdida de balines por cortes en el hilo.]"],
      },
      {
        heading: "Cómo hacerla válida",
        paragraphs: [
          "Escríbenos por WhatsApp con tu número de pedido y una foto de la pieza. Te decimos cómo enviarla al taller.",
        ],
      },
    ],
  },
  {
    slug: "cuidado",
    title: "Cuidado de tu manilla",
    intro: "El oro 18K no se oxida; el cordón es la parte que se desgasta. Con estos cuidados te dura mucho más.",
    inFooter: true,
    sections: [
      {
        heading: "En el día a día",
        paragraphs: [
          "Quítatela para la piscina y el mar: el cloro y la sal resecan el cordón.",
          "Ponte perfume y cremas antes de la manilla y deja que sequen.",
          "Guárdala seca, en la bolsa que viene con tu pedido.",
        ],
      },
      {
        heading: "Limpieza",
        paragraphs: ["Pasa un paño suave y seco por los balines. No uses químicos ni cepillos duros sobre el cordón."],
      },
    ],
  },
  {
    slug: "guia-de-tallas",
    title: "Guía de tallas",
    intro: "Mide tu muñeca y elige la talla. Todas las manillas son ajustables dentro de su rango.",
    inFooter: true,
    sections: [
      {
        heading: "Cómo medirte",
        paragraphs: [
          "Rodea tu muñeca con una cinta métrica, o con un hilo que luego mides con una regla, justo donde llevarías la manilla.",
          "A esa medida súmale [X] cm para que quede cómoda.",
        ],
      },
      {
        heading: "Tallas",
        paragraphs: ["S: [min]–[x] cm · M: [x]–[y] cm · L: [y]–[max] cm.", "¿Tu medida no está? Pídela personalizada por WhatsApp."],
      },
    ],
  },
  {
    slug: "preguntas-frecuentes",
    title: "Preguntas frecuentes",
    intro: "Lo que más nos preguntan antes de comprar.",
    inFooter: true,
    sections: [
      {
        heading: "¿El oro es 18K de verdad?",
        paragraphs: [
          "Sí. Los balines son de oro 18K ley 750 (75 % oro puro). Cada manilla incluye certificado de autenticidad con el peso del oro en gramos.",
        ],
      },
      {
        heading: "¿Cómo pago?",
        paragraphs: ["En línea con Mercado Pago (Nequi, PSE, tarjeta, Efecty) o confirmando tu pedido por WhatsApp."],
      },
      {
        heading: "¿Hacen piezas personalizadas?",
        paragraphs: ["Sí: colores, medida o iniciales. Escríbenos por WhatsApp y te enviamos el precio y el tiempo de entrega."],
      },
    ],
  },
  {
    slug: "terminos",
    title: "Términos y condiciones",
    intro: `Condiciones de compra en ${site.name}.`,
    inFooter: false,
    sections: [
      {
        heading: "Vendedor",
        paragraphs: [`${site.sellerName} · ${site.sellerId} · ${site.city} · ${site.email}.`],
      },
      {
        heading: "Precios y pagos",
        paragraphs: [
          "Los precios están en pesos colombianos e incluyen [IVA si aplica]. El costo de envío se muestra antes de pagar.",
          "Los pagos en línea los procesa Mercado Pago. Nosotros no vemos ni guardamos los datos de tu tarjeta.",
        ],
      },
      {
        heading: "Retracto, garantía y reversión",
        paragraphs: ["Ver las páginas de Cambios y retracto y de Garantía."],
      },
    ],
  },
  {
    slug: "tratamiento-de-datos",
    title: "Política de tratamiento de datos",
    intro: "Cómo usamos tus datos personales, según la Ley 1581 de 2012.",
    inFooter: false,
    sections: [
      {
        heading: "Qué datos pedimos y para qué",
        paragraphs: [
          "Nombre, WhatsApp, correo y dirección: solo para procesar y enviar tu pedido y contactarte sobre él.",
        ],
      },
      {
        heading: "Tus derechos",
        paragraphs: [
          `Puedes conocer, actualizar, rectificar o pedir que borremos tus datos escribiendo a ${site.email}.`,
        ],
      },
      {
        heading: "Responsable",
        paragraphs: [`${site.sellerName} · ${site.sellerId} · ${site.city}.`],
      },
    ],
  },
];

export function getHelpPage(slug: string) {
  return HELP_PAGES.find((p) => p.slug === slug) ?? null;
}
