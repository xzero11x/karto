import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback as e, useEffect as t, useMemo as n, useRef as r, useState as i } from "react";
import { Box as a, Check as o, ChevronDown as s, Compass as c, Crosshair as l, Layers as u, Maximize2 as d, Minus as f, Orbit as p, Plus as m, X as h } from "lucide-react";
import { Fragment as g, jsx as _, jsxs as v } from "react/jsx-runtime";
import * as y from "@radix-ui/react-dropdown-menu";
// src/componentes/controles.tsx
function b({ ciudad: e, mapa: t, vista: n, onVista: r }) {
	let i = !t;
	return /* @__PURE__ */ v("div", {
		className: "karto-controls",
		role: "toolbar",
		"aria-label": "Navegación del mapa",
		children: [
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": "Acercar",
				title: "Acercar",
				disabled: i,
				onClick: () => t?.zoomIn({ duration: 350 }),
				children: /* @__PURE__ */ _(m, { size: 18 })
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": "Alejar",
				title: "Alejar",
				disabled: i,
				onClick: () => t?.zoomOut({ duration: 350 }),
				children: /* @__PURE__ */ _(f, { size: 18 })
			}),
			/* @__PURE__ */ _("span", {
				className: "karto-controls-sep",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": `Centrar en ${e.nombre}`,
				title: `Centrar en ${e.nombre}`,
				disabled: i,
				onClick: () => t?.flyTo({
					center: e.centro,
					zoom: 16.2,
					duration: 900,
					essential: !0
				}),
				children: /* @__PURE__ */ _(l, { size: 18 })
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": "Ver la extensión urbana",
				title: "Ver la extensión urbana",
				disabled: i,
				onClick: () => t?.fitBounds(e.extensionUrbana, {
					padding: 24,
					duration: 900
				}),
				children: /* @__PURE__ */ _(d, { size: 17 })
			}),
			/* @__PURE__ */ _("button", {
				type: "button",
				"aria-label": "Norte arriba",
				title: "Norte arriba",
				disabled: i,
				onClick: () => t?.easeTo({
					bearing: 0,
					duration: 600
				}),
				children: /* @__PURE__ */ _(c, { size: 18 })
			}),
			/* @__PURE__ */ _("span", {
				className: "karto-controls-sep",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				className: "karto-controls-3d",
				"aria-pressed": n === "2.5d",
				"aria-label": "Vista 2.5D",
				title: "Vista 2.5D · inclinación fija, se puede girar",
				disabled: i,
				onClick: () => r(n === "2.5d" ? "2d" : "2.5d"),
				children: [/* @__PURE__ */ _(a, { size: 16 }), /* @__PURE__ */ _("span", { children: "2.5D" })]
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				className: "karto-controls-3d",
				"aria-pressed": n === "3d",
				"aria-label": "Vista 3D libre",
				title: "Vista 3D libre · clic derecho o Ctrl + arrastrar para girar e inclinar",
				disabled: i,
				onClick: () => r(n === "3d" ? "2d" : "3d"),
				children: [/* @__PURE__ */ _(p, { size: 16 }), /* @__PURE__ */ _("span", { children: "3D" })]
			})
		]
	});
}
// src/componentes/ficha.tsx
var x = {
	edificio: "Edificación",
	edificio_complemento: "Edificación complementaria",
	red_vial: "Vía",
	conector: "Intersección",
	lugar: "Lugar",
	uso_suelo: "Uso del suelo",
	agua: "Agua",
	terreno: "Terreno"
}, S = {
	nombre: "Nombre",
	clase: "Clase",
	subtipo: "Subtipo",
	categoria: "Categoría",
	area_m2: "Área",
	altura_m: "Altura",
	tipo: "Origen de la altura",
	fuente: "Fuente",
	confianza: "Confianza",
	origen_altura: "Origen de la altura"
};
function ee(e, t) {
	return e === "area_m2" ? `${Number(t).toLocaleString("es-PE")} m²` : e === "altura_m" ? `${Number(t).toLocaleString("es-PE")} m` : String(t).replaceAll("_", " ");
}
function te({ seleccion: e, onCerrar: t }) {
	let n = Object.entries(e.propiedades).filter(([e, t]) => e in S && t !== null && t !== "" && t !== void 0), r = e.propiedades.nombre;
	return /* @__PURE__ */ v("aside", {
		className: "karto-info",
		"aria-label": x[e.tabla],
		children: [/* @__PURE__ */ v("header", { children: [/* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("p", {
			className: "karto-info-eyebrow",
			children: x[e.tabla]
		}), /* @__PURE__ */ _("h2", { children: typeof r == "string" && r ? r : "Sin nombre" })] }), /* @__PURE__ */ _("button", {
			type: "button",
			"aria-label": "Cerrar ficha",
			onClick: t,
			children: /* @__PURE__ */ _(h, { size: 18 })
		})] }), /* @__PURE__ */ v("dl", { children: [n.filter(([e]) => e !== "nombre").map(([e, t]) => /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("dt", { children: S[e] }), /* @__PURE__ */ _("dd", { children: ee(e, t) })] }, e)), /* @__PURE__ */ v("div", { children: [/* @__PURE__ */ _("dt", { children: "Identificador" }), /* @__PURE__ */ _("dd", {
			className: "karto-info-id",
			children: e.id
		})] })] })]
	});
}
// src/mapa/themes.ts
var C = {
	fondo: "#eaece8",
	terreno: "#eaece8",
	verde: "#cfe6c4",
	verdeBorde: "#a6cc9a",
	deporte: "#bfe3cc",
	cementerio: "#d4e0cd",
	educacion: "#e7defa",
	salud: "#fadbdb",
	residencial: "#e6e8e3",
	agua: "#b4d7ee",
	aguaLinea: "#8cc0e0",
	aguaTexto: "#3b7ca5",
	edificioChico: "#e6e3dc",
	edificio: "#dcd8cf",
	edificioGrande: "#d0ccc2",
	edificioMax: "#c2bdb1",
	edificioBorde: "#a7a193",
	edificioSombra: "#8b8576",
	viaBorde: "#c2c5bf",
	viaBordeMayor: "#d3b46f",
	troncal: "#fdd48a",
	principal: "#fff0c4",
	secundaria: "#ffffff",
	local: "#ffffff",
	sendero: "#b7aa92",
	senderoClaro: "#ebe5d6",
	texto: "#363c40",
	textoSecundario: "#5a6468",
	rutaTexto: "#8b6a22",
	lugar: "#7b8a91",
	poiComida: "#e8743b",
	poiHospedaje: "#8b5cf6",
	poiEducacion: "#2f7de1",
	poiSalud: "#e5484d",
	poiComercio: "#0e9f9f",
	poiCultura: "#a4693a",
	poiOcio: "#2e9d57",
	poiServicio: "#5b6b95",
	poiOtro: "#7b8a91",
	seleccion: "#0b66f5",
	halo: "#ffffff",
	simulada: "#efece5",
	volumenBajo: "#e3ebe8",
	volumenMedio: "#cfdeda",
	volumenAlto: "#aecbc4",
	volumenMaximo: "#86b0a6",
	sombra: "#5f665f",
	luz: "#ffffff",
	cielo: "#bcd9ee",
	horizonte: "#eef1ee",
	opacidadEdificio: .95,
	opacidadVolumen: 1
}, w = [
	"positron",
	"bright",
	"liberty",
	"dark",
	"fjord",
	"mono"
], ne = "positron", T = (e, t) => ({
	label: e,
	palette: {
		...C,
		...t
	}
}), E = {
	positron: T("Positron", {}),
	bright: T("Bright", {
		fondo: "#f8f4eb",
		terreno: "#f8f4eb",
		residencial: "#f0ece2",
		verde: "#cfe3b4",
		verdeBorde: "#a9c88b",
		cementerio: "#d5dfc5",
		educacion: "#eee1ef",
		salud: "#f3dcdc",
		agua: "#9fc9e2",
		aguaLinea: "#7eb4d6",
		aguaTexto: "#4b7b9b",
		edificioChico: "#e8dfd0",
		edificio: "#ded4c4",
		edificioGrande: "#d0c3b1",
		edificioMax: "#c0b29d",
		viaBordeMayor: "#d9a560",
		edificioBorde: "#bcae99",
		viaBorde: "#d0bda4",
		troncal: "#f2b968",
		principal: "#f6d48c",
		secundaria: "#fff1c3",
		local: "#ffffff",
		sendero: "#c4b291",
		senderoClaro: "#f0e6d1",
		texto: "#5e5145",
		textoSecundario: "#8a6954",
		rutaTexto: "#997136",
		lugar: "#bb8660",
		seleccion: "#bd622d",
		edificioSombra: "#a3927a",
		simulada: "#f3ecdf",
		volumenBajo: "#ecdcbd",
		volumenMedio: "#e3c48e",
		volumenAlto: "#d9a566",
		volumenMaximo: "#c47f45",
		sombra: "#6d5a44",
		luz: "#ffffff",
		cielo: "#a9d4f0",
		horizonte: "#f8f1e2"
	}),
	liberty: T("Liberty", {
		fondo: "#f2eee3",
		terreno: "#f2eee3",
		residencial: "#ebe6d8",
		verde: "#b8dc9f",
		verdeBorde: "#8ebd78",
		deporte: "#a6dcb0",
		cementerio: "#bdd7ac",
		educacion: "#e6d3f4",
		salud: "#f6cfcf",
		agua: "#98cff0",
		aguaLinea: "#66b6e3",
		aguaTexto: "#2a7bab",
		edificioChico: "#e6decf",
		edificio: "#ddd1bc",
		edificioGrande: "#d3c3a6",
		edificioMax: "#c8b48f",
		edificioBorde: "#a8957a",
		edificioSombra: "#9c8e76",
		viaBorde: "#c9bda3",
		viaBordeMayor: "#c98a36",
		troncal: "#f7a24a",
		principal: "#fbc968",
		secundaria: "#fde9ac",
		local: "#ffffff",
		sendero: "#a7967a",
		senderoClaro: "#ece0c6",
		texto: "#443d33",
		textoSecundario: "#675f52",
		rutaTexto: "#9a6a1d",
		lugar: "#8f7d63",
		poiOtro: "#8f7d63",
		seleccion: "#0e8f7c",
		simulada: "#f1ece1",
		volumenBajo: "#e2e6d2",
		volumenMedio: "#bcd3b6",
		volumenAlto: "#8ab7a0",
		volumenMaximo: "#55938a",
		sombra: "#625c4c",
		luz: "#ffffff",
		cielo: "#a8d2ee",
		horizonte: "#f5f0e4"
	}),
	dark: T("Dark", {
		fondo: "#0f151c",
		terreno: "#0f151c",
		residencial: "#131a22",
		verde: "#16382d",
		verdeBorde: "#24574a",
		deporte: "#1a4a39",
		cementerio: "#1d322b",
		educacion: "#29274f",
		salud: "#4a2435",
		agua: "#0c3a5e",
		aguaLinea: "#1d6fa0",
		aguaTexto: "#84c4ec",
		edificioChico: "#1d2836",
		edificio: "#263243",
		edificioGrande: "#303f54",
		edificioMax: "#3a4c66",
		edificioBorde: "#4a6080",
		edificioSombra: "#04070a",
		viaBorde: "#080c11",
		viaBordeMayor: "#080c11",
		troncal: "#f2b35d",
		principal: "#d3dce4",
		secundaria: "#a3b4c3",
		local: "#6a7e91",
		sendero: "#5a6d78",
		senderoClaro: "#3e515b",
		texto: "#e3eaf0",
		textoSecundario: "#aebdc9",
		rutaTexto: "#f0c47f",
		lugar: "#8fb1c0",
		poiComida: "#ff9a62",
		poiHospedaje: "#b79bff",
		poiEducacion: "#62a8ff",
		poiSalud: "#ff7a80",
		poiComercio: "#3fd0cf",
		poiCultura: "#d9a06a",
		poiOcio: "#58d68d",
		poiServicio: "#8fa0d6",
		poiOtro: "#8fb1c0",
		seleccion: "#4fe3c8",
		halo: "#0f151c",
		simulada: "#4a5661",
		volumenBajo: "#3f5f68",
		volumenMedio: "#4a8482",
		volumenAlto: "#62b3a4",
		volumenMaximo: "#9fe0c9",
		sombra: "#04070a",
		luz: "#dfeaf7",
		cielo: "#070d14",
		horizonte: "#22364a"
	}),
	fjord: T("Fjord", {
		fondo: "#eaf0f2",
		terreno: "#eaf0f2",
		residencial: "#e3e9eb",
		verde: "#c3d9d1",
		verdeBorde: "#9dbfb2",
		cementerio: "#cbdad4",
		educacion: "#e0e4ef",
		salud: "#eee0e3",
		agua: "#8fb8cc",
		aguaLinea: "#6b9eb8",
		aguaTexto: "#4a7c97",
		edificioChico: "#dde7e9",
		edificio: "#d4dfe1",
		edificioGrande: "#c3d0d4",
		edificioMax: "#b0c2c8",
		viaBordeMayor: "#c8bf98",
		edificioBorde: "#a8bfc6",
		viaBorde: "#bacbd0",
		troncal: "#e5dfc4",
		principal: "#f1ead5",
		secundaria: "#f8f5e9",
		local: "#ffffff",
		sendero: "#9db3ad",
		senderoClaro: "#dce7df",
		texto: "#49616e",
		textoSecundario: "#5c7986",
		rutaTexto: "#70858b",
		lugar: "#6d9899",
		seleccion: "#267e91",
		edificioSombra: "#8fa5ac",
		simulada: "#eef2f2",
		volumenBajo: "#d5e6e8",
		volumenMedio: "#a8cdd2",
		volumenAlto: "#74abb6",
		volumenMaximo: "#40849a",
		sombra: "#4b6068",
		luz: "#ffffff",
		cielo: "#a9cfe6",
		horizonte: "#e8f0f3"
	}),
	mono: T("Monocromo", {
		fondo: "#f5f5f5",
		terreno: "#f5f5f5",
		residencial: "#efefef",
		verde: "#e2e2e2",
		verdeBorde: "#c6c6c6",
		deporte: "#dcdcdc",
		cementerio: "#e4e4e4",
		educacion: "#e8e8e8",
		salud: "#eaeaea",
		agua: "#d2d2d2",
		aguaLinea: "#b4b4b4",
		aguaTexto: "#585858",
		edificioChico: "#c4c4c4",
		edificio: "#b2b2b2",
		edificioGrande: "#9e9e9e",
		edificioMax: "#878787",
		edificioBorde: "#5e5e5e",
		edificioSombra: "#8a8a8a",
		viaBorde: "#cdcdcd",
		viaBordeMayor: "#8c8c8c",
		troncal: "#ffffff",
		principal: "#ffffff",
		secundaria: "#ffffff",
		local: "#ffffff",
		sendero: "#a6a6a6",
		senderoClaro: "#e4e4e4",
		texto: "#1c1c1c",
		textoSecundario: "#4a4a4a",
		rutaTexto: "#555555",
		lugar: "#3a3a3a",
		poiComida: "#1a1a1a",
		poiHospedaje: "#3c3c3c",
		poiEducacion: "#565656",
		poiSalud: "#000000",
		poiComercio: "#707070",
		poiCultura: "#2a2a2a",
		poiOcio: "#484848",
		poiServicio: "#626262",
		poiOtro: "#7c7c7c",
		seleccion: "#000000",
		halo: "#ffffff",
		simulada: "#e6e6e6",
		volumenBajo: "#dedede",
		volumenMedio: "#c2c2c2",
		volumenAlto: "#9c9c9c",
		volumenMaximo: "#6c6c6c",
		sombra: "#3a3a3a",
		luz: "#ffffff",
		cielo: "#e8e8e8",
		horizonte: "#f6f6f6",
		opacidadEdificio: .62,
		opacidadVolumen: .72
	})
};
// src/componentes/selector-estilo.tsx
function re({ tema: e, onCambio: t }) {
	return /* @__PURE__ */ v(y.Root, { children: [/* @__PURE__ */ v(y.Trigger, {
		className: "karto-style-trigger",
		"aria-label": `Estilo del mapa: ${E[e].label}`,
		children: [
			/* @__PURE__ */ _(u, {
				size: 16,
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ _("span", { children: E[e].label }),
			/* @__PURE__ */ _(s, {
				size: 14,
				"aria-hidden": "true"
			})
		]
	}), /* @__PURE__ */ _(y.Portal, { children: /* @__PURE__ */ v(y.Content, {
		className: "karto-style-menu",
		align: "start",
		sideOffset: 8,
		collisionPadding: 12,
		children: [
			/* @__PURE__ */ _(y.Label, {
				className: "karto-style-label",
				children: "Apariencia del mapa"
			}),
			/* @__PURE__ */ _(y.RadioGroup, {
				value: e,
				onValueChange: (e) => t(e),
				children: w.map((e) => /* @__PURE__ */ v(y.RadioItem, {
					className: "karto-style-option",
					value: e,
					children: [
						/* @__PURE__ */ _("span", {
							className: `karto-style-swatch karto-swatch-${e}`,
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ _("span", { children: E[e].label }),
						/* @__PURE__ */ _(y.ItemIndicator, {
							className: "karto-style-check",
							children: /* @__PURE__ */ _(o, { size: 16 })
						})
					]
				}, e))
			}),
			/* @__PURE__ */ _("p", {
				className: "karto-style-note",
				children: "Overture Maps · cambia solo la apariencia"
			})
		]
	}) })] });
}
// src/config.ts
var D = "/karto/", O = "bagua";
function k(e, t = D) {
	let n = t.endsWith("/") ? t : `${t}/`;
	return new URL(`${n}${e}`, window.location.href).toString();
}
var ie = (e) => e ? `pmtiles://${k(`${e.ciudad.id}/teselas.pmtiles`, e.datos)}?v=${e.ciudad.revisionTeselas}` : `pmtiles://${k(`${O}/teselas.pmtiles`)}`, ae = (e) => `${k("fuentes", e?.datos)}/{fontstack}/{range}.pbf`, A = (e) => k("maplibre-gl-worker.mjs", e), oe = (e) => e?.ciudad.atribucion ?? "© <a href=\"https://overturemaps.org\" target=\"_blank\" rel=\"noreferrer\">Overture Maps Foundation</a> · © OpenStreetMap (ODbL)", j = /* @__PURE__ */ new Map();
function se(e) {
	return j.has(e) || j.set(e, fetch(e).then((t) => {
		if (!t.ok) throw Error(`No se pudo leer ${e}`);
		return t.json();
	})), j.get(e);
}
function M(e, n = !0) {
	let [r, a] = i({
		error: !1,
		cargando: n
	}), [o, s] = i(0);
	return t(() => {
		if (!n) return;
		let t = !0;
		return a((e) => ({
			...e,
			cargando: !0,
			error: !1
		})), se(e).then((e) => t && a({
			datos: e,
			error: !1,
			cargando: !1
		})).catch(() => {
			j.delete(e), t && a({
				error: !0,
				cargando: !1
			});
		}), () => {
			t = !1;
		};
	}, [
		e,
		n,
		o
	]), {
		...r,
		reintentar: () => s((e) => e + 1)
	};
}
var N = (e, t, n) => k(`${t}/${n}`, e), ce = (e, t) => M(N(e, t, "ciudad.json")), le = (e, t, n) => M(N(e, t, "alturas.geojson"), n), ue = (e, t) => M(N(e, t, "complemento.geojson")), de = (e, t) => M(N(e, t, "correcciones.json")), P = !1, F = !1;
async function I(e) {
	let [t, n] = await Promise.all([import("maplibre-gl"), import("pmtiles")]);
	return F ||= (t.setWorkerUrl(e), !0), P ||= (t.addProtocol("pmtiles", new n.Protocol().tile), !0), t;
}
// src/mapa/style.ts
var L = "overture", R = (e, t, n) => [
	"interpolate",
	["exponential", 1.6],
	["zoom"],
	12,
	e,
	14,
	t,
	18,
	n
], z = 20, B = 2 ** 16 / 77892, V = [
	{
		clases: [
			"motorway",
			"trunk",
			"primary"
		],
		z12: 1.8,
		z14: 4.5,
		metros: 9,
		rango: 4
	},
	{
		clases: ["secondary", "tertiary"],
		z12: 1.3,
		z14: 3.4,
		metros: 7.5,
		rango: 3
	},
	{
		clases: [
			"residential",
			"unclassified",
			"unknown"
		],
		z12: .7,
		z14: 2.6,
		metros: 6,
		rango: 2
	},
	{
		clases: ["service", "living_street"],
		z12: .4,
		z14: 1.3,
		metros: 4,
		rango: 1
	},
	{
		clases: [
			"footway",
			"path",
			"track",
			"steps",
			"pedestrian",
			"cycleway"
		],
		z12: .4,
		z14: .8,
		metros: 2,
		rango: 0
	}
], H = (e) => [
	"match",
	["get", "clase"],
	...V.flatMap((t) => [[...t.clases], e(t)]),
	e(V[2])
], U = [
	"==",
	["get", "doble_calzada"],
	1
], fe = [
	"max",
	3,
	[
		"min",
		H((e) => e.metros),
		[
			"-",
			[
				"coalesce",
				["get", "separacion_m"],
				12
			],
			3.5
		]
	]
], W = (e, t) => [
	"case",
	U,
	[
		"+",
		[
			"*",
			fe,
			B * 2 ** (e - 16)
		],
		t
	],
	[
		"+",
		[
			"*",
			[
				"coalesce",
				["get", "ancho_m"],
				H((e) => e.metros)
			],
			B * 2 ** (e - 16)
		],
		t
	]
], G = (e = 0) => [
	"interpolate",
	["exponential", 2],
	["zoom"],
	12,
	[
		"case",
		U,
		H((t) => t.z12 * .6 + e),
		H((t) => t.z12 + e)
	],
	14,
	[
		"case",
		U,
		H((t) => t.z14 * .6 + e),
		H((t) => t.z14 + e)
	],
	16,
	W(16, e),
	z,
	W(z, e)
], K = H((e) => e.rango), q = [
	"interpolate",
	["linear"],
	["zoom"],
	12,
	.5,
	16,
	1.4,
	z,
	3
], J = (e, t) => {
	let n = t * Math.PI / 180, r = (t) => {
		let r = e * B * 2 ** (t - 16);
		return ["literal", [+(r * Math.sin(n)).toFixed(2), +(-r * Math.cos(n)).toFixed(2)]];
	};
	return [
		"interpolate",
		["exponential", 2],
		["zoom"],
		15,
		r(15),
		z,
		r(z)
	];
}, pe = 295, me = [
	"match",
	["get", "clase"],
	[
		"motorway",
		"trunk",
		"primary",
		"secondary",
		"tertiary",
		"residential",
		"unclassified",
		"service",
		"living_street",
		"unknown"
	],
	!0,
	!1
], he = [
	"match",
	["get", "clase"],
	[
		"footway",
		"path",
		"track",
		"steps",
		"pedestrian",
		"cycleway"
	],
	!0,
	!1
], Y = (e) => [
	"interpolate",
	["linear"],
	[
		"coalesce",
		["get", "area_m2"],
		60
	],
	20,
	e.edificioChico,
	120,
	e.edificio,
	400,
	e.edificioGrande,
	1500,
	e.edificioMax
], ge = (e) => [
	"match",
	["get", "categoria"],
	[
		"restaurant",
		"bar_and_grill_restaurant",
		"chinese_restaurant",
		"fast_food_restaurant",
		"chicken_restaurant",
		"cafe",
		"bakery",
		"cupcake_shop",
		"dance_club",
		"liquor_store"
	],
	e.poiComida,
	[
		"hotel",
		"hostel",
		"lodging",
		"spa"
	],
	e.poiHospedaje,
	["school", "college_university"],
	e.poiEducacion,
	[
		"hospital",
		"pharmacy",
		"dental_clinic",
		"outpatient_care_facility",
		"health_care"
	],
	e.poiSalud,
	[
		"clothing_store",
		"shopping",
		"electronics_store",
		"department_store",
		"shopping_mall",
		"sportswear_store",
		"womens_clothing_store",
		"beauty_supply_store",
		"arts_crafts_and_hobby_store",
		"beauty_salon"
	],
	e.poiComercio,
	[
		"historic_site",
		"cultural_center",
		"christian_place_of_worship",
		"religious_organization"
	],
	e.poiCultura,
	[
		"park",
		"public_plaza",
		"stadium_arena",
		"gym",
		"sport_or_fitness_facility"
	],
	e.poiOcio,
	[
		"government_office",
		"community_and_government",
		"social_or_community_service",
		"fire_protection_service",
		"notary_public"
	],
	e.poiServicio,
	e.poiOtro
];
function X(e = "positron", t) {
	let n = E[e].palette, r = [
		"match",
		["get", "clase"],
		["motorway", "trunk"],
		n.troncal,
		"primary",
		n.principal,
		"secondary",
		n.secundaria,
		n.local
	];
	return {
		version: 8,
		name: `BAGUA MASTER · Overture · ${E[e].label}`,
		metadata: {
			"karto:base": "Overture Maps",
			"karto:referencia-visual": E[e].label
		},
		light: {
			anchor: "map",
			color: n.luz,
			intensity: .38,
			position: [
				1.6,
				pe,
				38
			]
		},
		sky: {
			"sky-color": n.cielo,
			"horizon-color": n.horizonte,
			"fog-color": n.horizonte,
			"sky-horizon-blend": .7,
			"horizon-fog-blend": .8,
			"fog-ground-blend": .85,
			"atmosphere-blend": 0
		},
		glyphs: ae(t),
		sources: {
			[L]: {
				type: "vector",
				url: ie(t),
				attribution: oe(t)
			},
			"bm-alturas": {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				},
				...t?.ciudad.alturas ? { attribution: t.ciudad.alturas.atribucion } : {}
			},
			"bm-complemento": {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				},
				...t?.ciudad.complemento ? { attribution: t.ciudad.complemento.atribucion } : {}
			},
			"bm-agregados": {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			},
			"bm-lugares-movidos": {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		},
		layers: [
			{
				id: "bm-fondo",
				type: "background",
				paint: { "background-color": n.fondo }
			},
			{
				id: "bm-terreno",
				type: "fill",
				source: L,
				"source-layer": "terreno",
				filter: [
					"==",
					["geometry-type"],
					"Polygon"
				],
				paint: { "fill-color": n.terreno }
			},
			{
				id: "bm-usos",
				type: "fill",
				source: L,
				"source-layer": "usos_suelo",
				paint: {
					"fill-color": [
						"match",
						["get", "clase"],
						["pitch", "stadium"],
						n.deporte,
						[
							"park",
							"resort",
							"grass",
							"garden",
							"recreation_ground"
						],
						n.verde,
						"cemetery",
						n.cementerio,
						[
							"school",
							"college",
							"university",
							"kindergarten"
						],
						n.educacion,
						["hospital", "clinic"],
						n.salud,
						n.residencial
					],
					"fill-opacity": 1
				}
			},
			{
				id: "bm-usos-borde",
				type: "line",
				source: L,
				"source-layer": "usos_suelo",
				minzoom: 14,
				filter: [
					"match",
					["get", "clase"],
					[
						"park",
						"pitch",
						"stadium",
						"resort"
					],
					!0,
					!1
				],
				paint: {
					"line-color": n.verdeBorde,
					"line-width": 1
				}
			},
			{
				id: "bm-agua-area",
				type: "fill",
				source: L,
				"source-layer": "agua",
				filter: [
					"==",
					["geometry-type"],
					"Polygon"
				],
				paint: { "fill-color": n.agua }
			},
			{
				id: "bm-agua-linea",
				type: "line",
				source: L,
				"source-layer": "agua",
				filter: [
					"==",
					["geometry-type"],
					"LineString"
				],
				layout: {
					"line-cap": "round",
					"line-join": "round"
				},
				paint: {
					"line-color": n.aguaLinea,
					"line-width": R(1.5, 4, 14)
				}
			},
			{
				id: "bm-senderos",
				type: "line",
				source: L,
				"source-layer": "red_vial",
				minzoom: 14,
				filter: he,
				layout: {
					"line-cap": "round",
					"line-join": "round"
				},
				paint: {
					"line-color": [
						"interpolate",
						["linear"],
						["zoom"],
						16.5,
						n.sendero,
						17,
						n.senderoClaro
					],
					"line-width": G(),
					"line-dasharray": [
						"step",
						["zoom"],
						["literal", [2, 1.5]],
						17,
						["literal", [1, 0]]
					]
				}
			},
			{
				id: "bm-vias-borde",
				type: "line",
				source: L,
				"source-layer": "red_vial",
				filter: me,
				layout: {
					"line-cap": "round",
					"line-join": "round",
					"line-sort-key": K
				},
				paint: {
					"line-color": [
						"match",
						["get", "clase"],
						[
							"motorway",
							"trunk",
							"primary",
							"secondary"
						],
						n.viaBordeMayor,
						n.viaBorde
					],
					"line-gap-width": G(),
					"line-width": q
				}
			},
			{
				id: "bm-vias",
				type: "line",
				source: L,
				"source-layer": "red_vial",
				filter: me,
				layout: {
					"line-cap": "round",
					"line-join": "round",
					"line-sort-key": K
				},
				paint: {
					"line-color": r,
					"line-width": G()
				}
			},
			{
				id: "bm-edificios-sombra",
				type: "fill",
				source: L,
				"source-layer": "edificios",
				minzoom: 15,
				paint: {
					"fill-color": n.edificioSombra,
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						15,
						0,
						16,
						.5
					],
					"fill-translate": J(1.1, 115),
					"fill-translate-anchor": "map"
				}
			},
			{
				id: "bm-edificios",
				type: "fill",
				source: L,
				"source-layer": "edificios",
				minzoom: 13.5,
				paint: {
					"fill-color": Y(n),
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						13.5,
						0,
						14.5,
						n.opacidadEdificio
					]
				}
			},
			{
				id: "bm-edificios-borde",
				type: "line",
				source: L,
				"source-layer": "edificios",
				minzoom: 15,
				paint: {
					"line-color": n.edificioBorde,
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15,
						.4,
						18,
						1.1
					]
				}
			},
			{
				id: "bm-complemento",
				type: "fill",
				source: "bm-complemento",
				minzoom: 13.5,
				paint: {
					"fill-color": Y(n),
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						13.5,
						0,
						14.5,
						n.opacidadEdificio
					]
				}
			},
			{
				id: "bm-complemento-borde",
				type: "line",
				source: "bm-complemento",
				minzoom: 15,
				paint: {
					"line-color": n.edificioBorde,
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15,
						.4,
						18,
						1.1
					]
				}
			},
			{
				id: "bm-agregados",
				type: "fill",
				source: "bm-agregados",
				minzoom: 13.5,
				paint: {
					"fill-color": Y(n),
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						13.5,
						0,
						14.5,
						n.opacidadEdificio
					]
				}
			},
			{
				id: "bm-agregados-borde",
				type: "line",
				source: "bm-agregados",
				minzoom: 15,
				paint: {
					"line-color": n.edificioBorde,
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15,
						.4,
						18,
						1.1
					]
				}
			},
			{
				id: "bm-conectores",
				type: "circle",
				source: L,
				"source-layer": "conectores",
				minzoom: 17.5,
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						17.5,
						2.2,
						z,
						4.5
					],
					"circle-color": n.halo,
					"circle-stroke-color": n.viaBorde,
					"circle-stroke-width": 1.2
				}
			},
			{
				id: "bm-edificios-3d",
				type: "fill-extrusion",
				source: L,
				"source-layer": "edificios",
				minzoom: 15,
				filter: ["has", "altura_m"],
				layout: { visibility: "none" },
				paint: {
					"fill-extrusion-color": n.edificioGrande,
					"fill-extrusion-height": ["get", "altura_m"],
					"fill-extrusion-opacity": Math.min(.85, n.opacidadVolumen)
				}
			},
			{
				id: "bm-alturas-sombra",
				type: "fill",
				source: "bm-alturas",
				minzoom: 15,
				layout: { visibility: "none" },
				paint: {
					"fill-color": n.sombra,
					"fill-opacity": .32,
					"fill-translate": J(7, 115),
					"fill-translate-anchor": "map"
				}
			},
			{
				id: "bm-alturas-3d",
				type: "fill-extrusion",
				source: "bm-alturas",
				minzoom: 15,
				layout: { visibility: "none" },
				paint: {
					"fill-extrusion-height": ["get", "altura_m"],
					"fill-extrusion-base": 0,
					"fill-extrusion-color": [
						"case",
						[
							"==",
							["get", "tipo"],
							"simulada"
						],
						n.simulada,
						[
							"interpolate",
							["linear"],
							["get", "altura_m"],
							2,
							n.volumenBajo,
							8,
							n.volumenMedio,
							20,
							n.volumenAlto,
							40,
							n.volumenMaximo
						]
					],
					"fill-extrusion-vertical-gradient": !0,
					"fill-extrusion-opacity": n.opacidadVolumen
				}
			},
			{
				id: "bm-alturas-seleccion",
				type: "fill-extrusion",
				source: "bm-alturas",
				minzoom: 15,
				filter: [
					"==",
					["get", "id"],
					""
				],
				layout: { visibility: "none" },
				paint: {
					"fill-extrusion-height": ["get", "altura_m"],
					"fill-extrusion-color": n.seleccion,
					"fill-extrusion-opacity": .95
				}
			},
			{
				id: "bm-complemento-3d",
				type: "fill-extrusion",
				source: "bm-complemento",
				minzoom: 15,
				layout: { visibility: "none" },
				paint: {
					"fill-extrusion-height": ["get", "altura_m"],
					"fill-extrusion-base": 0,
					"fill-extrusion-color": [
						"case",
						[
							"==",
							["get", "origen_altura"],
							"estimada_default"
						],
						n.simulada,
						[
							"interpolate",
							["linear"],
							["get", "altura_m"],
							2,
							n.volumenBajo,
							8,
							n.volumenMedio,
							20,
							n.volumenAlto,
							40,
							n.volumenMaximo
						]
					],
					"fill-extrusion-vertical-gradient": !0,
					"fill-extrusion-opacity": n.opacidadVolumen
				}
			},
			{
				id: "bm-agregados-3d",
				type: "fill-extrusion",
				source: "bm-agregados",
				minzoom: 15,
				layout: { visibility: "none" },
				paint: {
					"fill-extrusion-height": ["get", "altura_m"],
					"fill-extrusion-base": 0,
					"fill-extrusion-color": n.simulada,
					"fill-extrusion-vertical-gradient": !0,
					"fill-extrusion-opacity": n.opacidadVolumen
				}
			},
			{
				id: "bm-complemento-seleccion",
				type: "line",
				source: "bm-complemento",
				filter: [
					"==",
					["get", "id"],
					""
				],
				paint: {
					"line-color": n.seleccion,
					"line-width": 3
				}
			},
			{
				id: "bm-seleccion-area",
				type: "line",
				source: L,
				"source-layer": "edificios",
				filter: [
					"==",
					["get", "id"],
					""
				],
				paint: {
					"line-color": n.seleccion,
					"line-width": 3
				}
			},
			{
				id: "bm-seleccion-via",
				type: "line",
				source: L,
				"source-layer": "red_vial",
				filter: [
					"==",
					["get", "id"],
					""
				],
				layout: { "line-cap": "round" },
				paint: {
					"line-color": n.seleccion,
					"line-width": G(4),
					"line-opacity": .55
				}
			},
			{
				id: "bm-agua-texto",
				type: "symbol",
				source: L,
				"source-layer": "agua",
				filter: [
					"all",
					["has", "nombre"],
					[
						"==",
						["geometry-type"],
						"LineString"
					]
				],
				layout: {
					"symbol-placement": "line",
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Italic"],
					"text-size": [
						"interpolate",
						["linear"],
						["zoom"],
						12,
						12,
						17,
						16
					],
					"text-letter-spacing": .08
				},
				paint: {
					"text-color": n.aguaTexto,
					"text-halo-color": n.halo,
					"text-halo-width": 1.8
				}
			},
			{
				id: "bm-agua-texto-area",
				type: "symbol",
				source: L,
				"source-layer": "agua",
				minzoom: 15,
				filter: [
					"all",
					["has", "nombre"],
					[
						"==",
						["geometry-type"],
						"Polygon"
					]
				],
				layout: {
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Italic"],
					"text-size": 12
				},
				paint: {
					"text-color": n.aguaTexto,
					"text-halo-color": n.halo,
					"text-halo-width": 1.8
				}
			},
			{
				id: "bm-calles-texto",
				type: "symbol",
				source: L,
				"source-layer": "calles_rotulo",
				minzoom: 14.5,
				filter: [
					"==",
					["get", "tipo"],
					"calle"
				],
				layout: {
					"symbol-placement": "line",
					"symbol-sort-key": [
						"*",
						-1,
						["get", "rango"]
					],
					"text-field": ["get", "nombre"],
					"text-font": [
						"case",
						[
							">=",
							[
								"coalesce",
								["get", "rango"],
								0
							],
							3
						],
						["literal", ["Noto Sans Medium"]],
						["literal", ["Noto Sans Regular"]]
					],
					"text-size": [
						"interpolate",
						["linear"],
						["zoom"],
						14.5,
						10.5,
						16,
						12,
						18,
						14
					],
					"text-letter-spacing": .02,
					"text-padding": 2,
					"symbol-spacing": 360,
					"text-max-angle": 45
				},
				paint: {
					"text-color": n.texto,
					"text-halo-color": n.halo,
					"text-halo-width": 1.4,
					"text-halo-blur": .4
				}
			},
			{
				id: "bm-rutas-texto",
				type: "symbol",
				source: L,
				"source-layer": "calles_rotulo",
				minzoom: 12.5,
				filter: [
					"==",
					["get", "tipo"],
					"ruta"
				],
				layout: {
					"symbol-placement": "line",
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Italic"],
					"text-size": [
						"interpolate",
						["linear"],
						["zoom"],
						12.5,
						11,
						16,
						13,
						18,
						15
					],
					"text-letter-spacing": .05,
					"text-padding": 2,
					"symbol-spacing": 420,
					"text-max-angle": 45
				},
				paint: {
					"text-color": n.rutaTexto,
					"text-halo-color": n.halo,
					"text-halo-width": 2.2
				}
			},
			{
				id: "bm-terreno-texto",
				type: "symbol",
				source: L,
				"source-layer": "terreno",
				filter: [
					"all",
					["has", "nombre"],
					[
						"==",
						["geometry-type"],
						"LineString"
					]
				],
				layout: {
					"symbol-placement": "line",
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Italic"],
					"text-size": 12
				},
				paint: {
					"text-color": n.textoSecundario,
					"text-halo-color": n.halo,
					"text-halo-width": 1.5
				}
			},
			{
				id: "bm-lugares",
				type: "circle",
				source: L,
				"source-layer": "lugares",
				minzoom: 15.5,
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						15.5,
						3,
						18,
						6
					],
					"circle-color": ge(n),
					"circle-stroke-color": n.halo,
					"circle-stroke-width": 1.8
				}
			},
			{
				id: "bm-lugares-texto",
				type: "symbol",
				source: L,
				"source-layer": "lugares",
				minzoom: 16,
				layout: {
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Medium"],
					"text-size": [
						"interpolate",
						["linear"],
						["zoom"],
						16,
						10.5,
						18,
						12.5
					],
					"text-offset": [0, 1.1],
					"text-anchor": "top",
					"text-max-width": 10,
					"text-optional": !0
				},
				paint: {
					"text-color": n.texto,
					"text-halo-color": n.halo,
					"text-halo-width": 1.8
				}
			},
			{
				id: "bm-lugares-movidos",
				type: "circle",
				source: "bm-lugares-movidos",
				minzoom: 15.5,
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						15.5,
						3,
						18,
						6
					],
					"circle-color": ge(n),
					"circle-stroke-color": n.halo,
					"circle-stroke-width": 1.8
				}
			},
			{
				id: "bm-lugares-movidos-texto",
				type: "symbol",
				source: "bm-lugares-movidos",
				minzoom: 16,
				layout: {
					"text-field": ["get", "nombre"],
					"text-font": ["Noto Sans Medium"],
					"text-size": [
						"interpolate",
						["linear"],
						["zoom"],
						16,
						10.5,
						18,
						12.5
					],
					"text-offset": [0, 1.1],
					"text-anchor": "top",
					"text-max-width": 10,
					"text-optional": !0
				},
				paint: {
					"text-color": n.texto,
					"text-halo-color": n.halo,
					"text-halo-width": 1.8
				}
			}
		]
	};
}
var Z = [
	{
		layer: "bm-complemento-3d",
		tabla: "edificio_complemento"
	},
	{
		layer: "bm-alturas-3d",
		tabla: "edificio"
	},
	{
		layer: "bm-lugares-movidos",
		tabla: "lugar"
	},
	{
		layer: "bm-lugares",
		tabla: "lugar"
	},
	{
		layer: "bm-conectores",
		tabla: "conector"
	},
	{
		layer: "bm-vias",
		tabla: "red_vial"
	},
	{
		layer: "bm-senderos",
		tabla: "red_vial"
	},
	{
		layer: "bm-edificios",
		tabla: "edificio"
	},
	{
		layer: "bm-complemento",
		tabla: "edificio_complemento"
	},
	{
		layer: "bm-agua-linea",
		tabla: "agua"
	},
	{
		layer: "bm-agua-area",
		tabla: "agua"
	},
	{
		layer: "bm-usos",
		tabla: "uso_suelo"
	},
	{
		layer: "bm-terreno",
		tabla: "terreno"
	}
], Q = null, $ = (e) => ["!", [
	"in",
	["get", "id"],
	["literal", e]
]], _e = {
	"2d": [0, 0],
	"2.5d": [58, 58],
	"3d": [0, 85]
};
function ve(e, t) {
	let n = Z.filter((t) => e.getLayer(t.layer)), r = e.queryRenderedFeatures(t, { layers: n.map((e) => e.layer) });
	for (let e of n) {
		let t = r.find((t) => t.layer.id === e.layer), n = t?.properties?.id;
		if (typeof n == "string") return {
			tabla: e.tabla,
			id: n,
			propiedades: { ...t.properties }
		};
	}
	return null;
}
function ye({ origen: e, seleccion: n, vista: a, tema: o, alturas: s, mostrarSimuladas: c, complemento: l, correcciones: u, onSeleccion: d, onMapa: f, onFallo: p }) {
	let m = r(null), h = r(null), g = r({
		onSeleccion: d,
		onMapa: f,
		onFallo: p
	}), v = r(e), y = r(o), b = a !== "2d", [x, S] = i(!1);
	return t(() => {
		g.current = {
			onSeleccion: d,
			onMapa: f,
			onFallo: p
		};
	}, [
		d,
		f,
		p
	]), t(() => {
		let e = m.current;
		if (!e) return;
		let t = !1, n, r = new ResizeObserver(() => n?.resize());
		return r.observe(e), I(A(v.current.datos)).then((r) => {
			if (t) return;
			let { ciudad: i } = v.current, [[a, o], [s, c]] = i.limites, l = Q?.ciudad === i.id ? Q : null;
			n = new r.Map({
				container: e,
				style: X(y.current, v.current),
				center: l?.center ?? i.centro,
				zoom: l?.zoom ?? i.zoom.inicial,
				pitch: l?.pitch ?? 0,
				minZoom: i.zoom.minimo,
				maxZoom: i.zoom.maximo,
				maxPitch: 85,
				maxBounds: [[a - .01, o - .01], [s + .01, c + .01]],
				attributionControl: { compact: !0 },
				dragRotate: !1,
				pitchWithRotate: !0,
				fadeDuration: 250
			}), h.current = n, n.touchZoomRotate.disableRotation(), n.getCanvas().setAttribute("aria-label", `Mapa urbano de ${v.current.ciudad.nombre}`), n.on("load", () => {
				t || (e.dataset.ready = "true", S(!0), g.current.onMapa(n ?? null));
			}), n.on("moveend", () => {
				if (!n) return;
				let e = n.getCenter();
				Q = {
					ciudad: v.current.ciudad.id,
					center: [e.lng, e.lat],
					zoom: n.getZoom(),
					pitch: n.getPitch()
				};
			}), n.on("idle", () => {
				n && (e.dataset.zoom = n.getZoom().toFixed(2), e.dataset.pitch = n.getPitch().toFixed(0));
			}), n.on("error", (e) => {
				!t && !n?.loaded() && g.current.onFallo(), console.warn("karto:", e.error?.message);
			}), n.on("click", (e) => {
				n && g.current.onSeleccion(ve(n, e.point));
			}), n.on("mousemove", (e) => {
				if (!n) return;
				let t = Z.map((e) => e.layer).filter((e) => n.getLayer(e) && e !== "bm-terreno" && e !== "bm-usos");
				n.getCanvas().style.cursor = n.queryRenderedFeatures(e.point, { layers: t }).length ? "pointer" : "";
			});
		}).catch(() => {
			t || g.current.onFallo();
		}), () => {
			t = !0, r.disconnect(), g.current.onMapa(null), n?.remove(), h.current = null;
		};
	}, []), t(() => {
		let e = h.current;
		if (!e || !x) return;
		let t = (e) => n?.tabla === e ? n.id : "";
		e.setFilter("bm-seleccion-area", [
			"==",
			["get", "id"],
			t("edificio")
		]), e.setFilter("bm-seleccion-via", [
			"==",
			["get", "id"],
			t("red_vial")
		]), e.setFilter("bm-complemento-seleccion", [
			"==",
			["get", "id"],
			t("edificio_complemento")
		]);
	}, [n, x]), t(() => {
		let t = h.current;
		if (!t || !x) return;
		let n = X(o, e);
		for (let e of n.layers) if (t.getLayer(e.id) && "paint" in e) for (let [n, r] of Object.entries(e.paint ?? {})) t.setPaintProperty(e.id, n, r);
		t.setLight(n.light), t.setSky(n.sky), m.current && (m.current.dataset.theme = o);
	}, [
		o,
		e,
		x
	]), t(() => {
		let e = h.current;
		e && x && s && e.getSource("bm-alturas").setData(s);
	}, [s, x]), t(() => {
		let e = h.current;
		if (!e || !x || !l) return;
		let t = new Set(u?.ocultos.edificio_complemento ?? []);
		e.getSource("bm-complemento").setData(t.size ? {
			...l,
			features: l.features.filter((e) => !t.has(String(e.properties?.id)))
		} : l);
	}, [
		l,
		u,
		x
	]), t(() => {
		let e = h.current;
		if (!e || !x) return;
		let t = u?.ocultos.edificio ?? [];
		for (let n of [
			"bm-edificios",
			"bm-edificios-borde",
			"bm-edificios-sombra"
		]) e.setFilter(n, $(t));
		e.setFilter("bm-edificios-3d", [
			"all",
			["has", "altura_m"],
			$(t)
		]);
		let n = (u?.lugaresMovidos.features ?? []).map((e) => String(e.properties?.id)), r = $([...u?.ocultos.lugar ?? [], ...n]);
		e.setFilter("bm-lugares", r), e.setFilter("bm-lugares-texto", r);
		let i = {
			type: "FeatureCollection",
			features: []
		};
		e.getSource("bm-lugares-movidos").setData(u?.lugaresMovidos ?? i), e.getSource("bm-agregados").setData(u?.edificiosAgregados ?? i);
	}, [u, x]), t(() => {
		let e = h.current;
		if (!e || !x) return;
		let t = $(u?.ocultos.edificio ?? []), r = c ? ["all", t] : [
			"all",
			t,
			[
				"!=",
				["get", "tipo"],
				"simulada"
			]
		];
		e.setFilter("bm-alturas-3d", r), e.setFilter("bm-alturas-sombra", r), e.setFilter("bm-alturas-seleccion", [
			"all",
			r,
			[
				"==",
				["get", "id"],
				n?.tabla === "edificio" ? n.id : ""
			]
		]);
	}, [
		c,
		n,
		u,
		x
	]), t(() => {
		let e = h.current;
		if (!e || !x) return;
		for (let t of [
			"bm-edificios-3d",
			"bm-alturas-3d",
			"bm-alturas-sombra",
			"bm-alturas-seleccion",
			"bm-complemento-3d",
			"bm-agregados-3d"
		]) e.setLayoutProperty(t, "visibility", b ? "visible" : "none");
		b ? (e.dragRotate.enable(), e.touchZoomRotate.enableRotation(), e.touchPitch.enable()) : (e.dragRotate.disable(), e.touchZoomRotate.disableRotation(), e.touchPitch.disable());
		let [t, n] = _e[a], r = a === "3d" ? Math.max(e.getPitch(), 68) : t;
		e.setMinPitch(0), e.setMaxPitch(85), e.easeTo({
			pitch: r,
			bearing: b ? e.getBearing() || -20 : 0,
			zoom: b ? Math.max(16.2, e.getZoom()) : e.getZoom(),
			duration: 900
		}), e.once("moveend", () => {
			e.setMinPitch(t), e.setMaxPitch(n);
		});
	}, [
		a,
		b,
		x
	]), /* @__PURE__ */ _("div", {
		ref: m,
		className: "karto-map",
		"data-testid": "mapa",
		"data-ready": "false",
		"data-theme": o,
		"data-modo": a
	});
}
// src/karto.tsx
function be({ datos: a = D, ciudad: o = O, temaInicial: s = ne, tema: c, onTema: l, vistaInicial: u = "2d", vista: d, onVista: f, controles: p = !0, selectorTema: m = !0, ficha: h = !0, alturasModeladas: y = !0, onSeleccion: x, onMapa: S, children: ee, className: C }) {
	let [w, T] = i(null), [E, k] = i(null), [ie, ae] = i(s), [A, oe] = i(u), [j, se] = i(y), [M, N] = i(!1), P = c ?? ie, F = d ?? A, I = F !== "2d", L = ce(a, o), R = le(a, o, I), z = ue(a, o), B = de(a, o), V = n(() => L.datos ? {
		datos: a,
		ciudad: L.datos
	} : null, [a, L.datos]), H = r({
		onSeleccion: x,
		onMapa: S
	});
	t(() => {
		H.current = {
			onSeleccion: x,
			onMapa: S
		};
	}, [x, S]);
	let U = e((e) => {
		k(e), H.current.onSeleccion?.(e);
	}, []), fe = e((e) => {
		T(e), H.current.onMapa?.(e);
	}, []), W = e(() => N(!0), []), G = (e) => {
		ae(e), l?.(e);
	}, K = (e) => {
		oe(e), f?.(e);
	}, q = n(() => {
		let e = {
			estimada: 0,
			simulada: 0
		};
		for (let t of R.datos?.features ?? []) {
			let n = t.properties?.tipo;
			n in e && (e[n] += 1);
		}
		return e;
	}, [R.datos]), J = n(() => {
		if (E?.tabla !== "edificio" || E.propiedades.altura_m !== void 0) return E;
		let e = R.datos?.features.find((e) => e.properties?.id === E.id);
		return e ? {
			...E,
			propiedades: {
				...E.propiedades,
				...e.properties
			}
		} : E;
	}, [E, R.datos]);
	return /* @__PURE__ */ v("div", {
		className: `karto${C ? ` ${C}` : ""}`,
		"aria-label": `Mapa urbano de ${L.datos?.nombre ?? ""}`,
		children: [
			V && /* @__PURE__ */ _(ye, {
				origen: V,
				seleccion: E,
				vista: F,
				tema: P,
				alturas: R.datos,
				mostrarSimuladas: j,
				complemento: z.datos,
				correcciones: B.datos,
				onSeleccion: U,
				onMapa: fe,
				onFallo: W
			}, `${a}|${V.ciudad.id}`),
			p && L.datos && /* @__PURE__ */ _(b, {
				ciudad: L.datos,
				mapa: w,
				vista: F,
				onVista: K
			}),
			m && /* @__PURE__ */ _(re, {
				tema: P,
				onCambio: G
			}),
			I && /* @__PURE__ */ v("details", {
				className: "karto-height-notice",
				children: [
					/* @__PURE__ */ v("summary", { children: [F === "3d" ? "Vista 3D libre" : "Vista 2.5D", " · alturas"] }),
					F === "3d" && /* @__PURE__ */ _("span", {
						className: "karto-height-observed",
						children: "Gira e inclina con clic derecho o Ctrl + arrastrar; en pantalla táctil, con dos dedos."
					}),
					R.error ? /* @__PURE__ */ v(g, { children: [
						"No se pudieron cargar las alturas.",
						" ",
						/* @__PURE__ */ _("button", {
							type: "button",
							onClick: R.reintentar,
							children: "Reintentar"
						})
					] }) : R.cargando ? "Cargando alturas…" : /* @__PURE__ */ v(g, { children: [/* @__PURE__ */ v("span", {
						className: "karto-height-observed",
						children: [
							L.datos?.alturas?.fuente ?? "Observadas",
							":",
							" ",
							q.estimada.toLocaleString("es-PE")
						]
					}), /* @__PURE__ */ v("label", {
						className: "karto-height-simulated",
						children: [
							/* @__PURE__ */ _("input", {
								type: "checkbox",
								checked: j,
								onChange: (e) => se(e.target.checked)
							}),
							"Modeladas: ",
							q.simulada.toLocaleString("es-PE")
						]
					})] })
				]
			}),
			(M || L.error) && /* @__PURE__ */ v("div", {
				className: "karto-failure",
				role: "alert",
				children: [
					"No se pudo cargar la cartografía de «",
					o,
					"». Revisa que los datos estén publicados en",
					" ",
					a,
					"."
				]
			}),
			h && J && /* @__PURE__ */ _(te, {
				seleccion: J,
				onCerrar: () => U(null)
			}, `${J.tabla}-${J.id}`),
			ee
		]
	});
}
export { O as CIUDAD_POR_DEFECTO, D as DATOS_POR_DEFECTO, ne as DEFAULT_THEME, be as Karto, E as MAP_THEMES, ye as Mapa, Z as SELECTABLE_LAYERS, L as SOURCE, w as THEME_NAMES, A as WORKER_URL, X as buildStyle, k as dataUrl, I as loadMapRuntime, ce as useCiudad };
