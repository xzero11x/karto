import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback as e, useEffect as t, useMemo as n, useRef as r, useState as i } from "react";
import { Box as a, Building2 as o, Check as s, ChevronDown as c, Compass as l, Crosshair as u, Layers as d, Maximize2 as f, Minus as p, Orbit as m, Plus as h, X as g } from "lucide-react";
import { Fragment as _, jsx as v, jsxs as y } from "react/jsx-runtime";
import * as b from "@radix-ui/react-dropdown-menu";
// src/componentes/controles.tsx
function x({ ciudad: e, mapa: t, vista: n, onVista: r, modo3d: i, onModo3d: s }) {
	let c = !t;
	return /* @__PURE__ */ y("div", {
		className: "karto-controls",
		role: "toolbar",
		"aria-label": "Navegación del mapa",
		children: [
			/* @__PURE__ */ v("button", {
				type: "button",
				"aria-label": "Acercar",
				title: "Acercar",
				disabled: c,
				onClick: () => t?.zoomIn({ duration: 350 }),
				children: /* @__PURE__ */ v(h, { size: 18 })
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				"aria-label": "Alejar",
				title: "Alejar",
				disabled: c,
				onClick: () => t?.zoomOut({ duration: 350 }),
				children: /* @__PURE__ */ v(p, { size: 18 })
			}),
			/* @__PURE__ */ v("span", {
				className: "karto-controls-sep",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				"aria-label": `Centrar en ${e.nombre}`,
				title: `Centrar en ${e.nombre}`,
				disabled: c,
				onClick: () => t?.flyTo({
					center: e.centro,
					zoom: 16.2,
					duration: 900,
					essential: !0
				}),
				children: /* @__PURE__ */ v(u, { size: 18 })
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				"aria-label": "Ver la extensión urbana",
				title: "Ver la extensión urbana",
				disabled: c,
				onClick: () => t?.fitBounds(e.extensionUrbana, {
					padding: 24,
					duration: 900
				}),
				children: /* @__PURE__ */ v(f, { size: 17 })
			}),
			/* @__PURE__ */ v("button", {
				type: "button",
				"aria-label": "Norte arriba",
				title: "Norte arriba",
				disabled: c,
				onClick: () => t?.easeTo({
					bearing: 0,
					duration: 600
				}),
				children: /* @__PURE__ */ v(l, { size: 18 })
			}),
			/* @__PURE__ */ v("span", {
				className: "karto-controls-sep",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ y("button", {
				type: "button",
				className: "karto-controls-3d",
				"aria-pressed": n === "2.5d",
				"aria-label": "Vista 2.5D",
				title: "Vista 2.5D · inclinación fija, se puede girar",
				disabled: c,
				onClick: () => r(n === "2.5d" ? "2d" : "2.5d"),
				children: [/* @__PURE__ */ v(a, { size: 16 }), /* @__PURE__ */ v("span", { children: "2.5D" })]
			}),
			/* @__PURE__ */ y("button", {
				type: "button",
				className: "karto-controls-3d",
				"aria-pressed": n === "3d",
				"aria-label": "Vista 3D libre",
				title: "Vista 3D libre · clic derecho o Ctrl + arrastrar para girar e inclinar",
				disabled: c,
				onClick: () => r(n === "3d" ? "2d" : "3d"),
				children: [/* @__PURE__ */ v(m, { size: 16 }), /* @__PURE__ */ v("span", { children: "3D" })]
			}),
			e.ciudad3d && /* @__PURE__ */ y("button", {
				type: "button",
				className: "karto-controls-3d",
				"data-testid": "karto-modo-ciudad",
				"aria-pressed": i === "ciudad",
				"aria-label": "Ciudad 3D detallada",
				title: i === "ciudad" ? "Ciudad 3D detallada: techos, fachadas, árboles y suelo. Clic para volver a volúmenes simples" : "Ciudad 3D detallada: techos, fachadas, árboles y suelo",
				disabled: c,
				onClick: () => {
					let e = i === "ciudad" ? "clasico" : "ciudad";
					s(e), e === "ciudad" && n === "2d" && r("3d");
				},
				children: [/* @__PURE__ */ v(o, { size: 16 }), /* @__PURE__ */ v("span", { children: "Ciudad" })]
			})
		]
	});
}
// src/componentes/ficha.tsx
var S = {
	edificio: "Edificación",
	edificio_complemento: "Edificación complementaria",
	red_vial: "Vía",
	conector: "Intersección",
	lugar: "Lugar",
	uso_suelo: "Uso del suelo",
	equipamiento: "Equipamiento",
	manzana: "Manzana",
	agua: "Agua",
	terreno: "Terreno"
}, C = {
	nombre: "Nombre",
	clase: "Clase",
	subtipo: "Subtipo",
	categoria: "Categoría",
	area_m2: "Área",
	altura_m: "Altura",
	tipo: "Origen de la altura",
	fuente: "Fuente",
	confianza: "Confianza",
	origen_altura: "Origen de la altura",
	ancho: "Ancho de calzada",
	paramento_izq: "Fachada izquierda (del eje)",
	paramento_der: "Fachada derecha (del eje)"
}, w = {
	townhall: "municipalidad",
	place_of_worship: "templo",
	hospital: "hospital",
	clinic: "clínica",
	police: "comisaría",
	marketplace: "mercado",
	school: "colegio",
	college: "instituto",
	university: "universidad",
	bus_station: "terminal terrestre",
	bank: "banco",
	stadium: "estadio",
	cemetery: "cementerio",
	swimming_pool: "piscina",
	sports_centre: "centro deportivo",
	pitch: "cancha",
	park: "parque"
}, T = /* @__PURE__ */ new Set([
	"altura_m",
	"ancho",
	"paramento_izq",
	"paramento_der"
]);
function E(e, t) {
	return e === "area_m2" ? `${Number(t).toLocaleString("es-PE")} m²` : T.has(e) ? `${Number(t).toLocaleString("es-PE")} m` : e === "clase" && typeof t == "string" && t in w ? w[t] : String(t).replaceAll("_", " ");
}
function D({ seleccion: e, onCerrar: t }) {
	let n = Object.entries(e.propiedades).filter(([e, t]) => e in C && t !== null && t !== "" && t !== void 0), r = e.propiedades.nombre;
	return /* @__PURE__ */ y("aside", {
		className: "karto-info",
		"aria-label": S[e.tabla],
		children: [/* @__PURE__ */ y("header", { children: [/* @__PURE__ */ y("div", { children: [/* @__PURE__ */ v("p", {
			className: "karto-info-eyebrow",
			children: S[e.tabla]
		}), /* @__PURE__ */ v("h2", { children: typeof r == "string" && r ? r : "Sin nombre" })] }), /* @__PURE__ */ v("button", {
			type: "button",
			"aria-label": "Cerrar ficha",
			onClick: t,
			children: /* @__PURE__ */ v(g, { size: 18 })
		})] }), /* @__PURE__ */ y("dl", { children: [n.filter(([e]) => e !== "nombre").map(([e, t]) => /* @__PURE__ */ y("div", { children: [/* @__PURE__ */ v("dt", { children: C[e] }), /* @__PURE__ */ v("dd", { children: E(e, t) })] }, e)), /* @__PURE__ */ y("div", { children: [/* @__PURE__ */ v("dt", { children: "Identificador" }), /* @__PURE__ */ v("dd", {
			className: "karto-info-id",
			children: e.id
		})] })] })]
	});
}
// src/mapa/ciudad/palette.ts
var O = [
	"#8b9396",
	"#9a5a3d",
	"#b65a3a",
	"#9f9685",
	"#4f7f9c",
	"#a9583f",
	"#a2402f",
	"#a6a296",
	"#a88d5e"
], k = [
	"Calamina",
	"Calamina oxidada",
	"Teja",
	"Concreto armado",
	"Calamina pintada",
	"Concreto impermeabilizado",
	"Calamina roja",
	"Fibrocemento",
	"Caña o estera"
], A = [
	[0, 58],
	[1, 30],
	[4, 30],
	[6, 25],
	[7, 30],
	[3, 51],
	[5, 24],
	[2, 4],
	[8, 4]
], j = (() => {
	let e = [], t = A.map(([e, t]) => ({
		roof: e,
		n: t
	}));
	for (; e.length < 256;) for (let n of t) n.n > 0 && (e.push(n.roof), n.n--);
	return e.slice(0, 256);
})(), M = [
	"#c06a42",
	"#ecdcb8",
	"#e8bd57",
	"#cf7653",
	"#ec9a7c",
	"#86c0dc",
	"#93d1a8",
	"#c9d76a",
	"#f2eee5",
	"#44aeb0",
	"#e996b0",
	"#5fc4aa",
	"#1f63b4",
	"#f0b323",
	"#f2f0ea",
	"#2f6f9f"
], ee = [
	"#d7263d",
	"#f4c430",
	"#1b75bc",
	"#2a9d4b",
	"#f26b1d",
	"#ffffff"
], te = [
	"#c62828",
	"#1565c0",
	"#f9a825",
	"#2e7d32",
	"#f5f5f5",
	"#9e9e9e",
	"#212121",
	"#ef6c00"
], ne = (e = O) => {
	let t = e.map(() => []);
	return j.forEach((e, n) => t[e].push(n.toString(16).padStart(2, "0"))), [
		"match",
		["downcase", [
			"slice",
			["to-string", ["get", "id"]],
			0,
			2
		]],
		...t.flatMap((t, n) => t.length ? [t, e[n]] : []),
		e[3]
	];
}, N = (e) => {
	let t = parseInt(e.slice(1), 16);
	return [
		(t >> 16 & 255) / 255,
		(t >> 8 & 255) / 255,
		(t & 255) / 255
	];
}, re = {
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
	opacidadVolumen: 1,
	cobBosque: "#cfe2c0",
	cobCultivo: "#e2ecc8",
	cobPasto: "#dbe8cc",
	cobMatorral: "#d6e3c6",
	cobDesnudo: "#e8e4da",
	cobHumedal: "#cfe5e3",
	arbol: "#9cc48a",
	arbolBorde: "#7fa86e",
	arbolSombra: "#5c6b58",
	ejeVia: "#ffffff",
	ejeViaPrincipal: "#f2c94c",
	techosColor: !1,
	noche: 0,
	saturacion: .75
}, ie = [
	"bagua",
	"positron",
	"bright",
	"liberty",
	"dark",
	"fjord",
	"mono"
], ae = "positron", P = (e, t) => ({
	label: e,
	palette: {
		...re,
		...t
	}
}), F = {
	bagua: P("Color", {
		fondo: "#dccaa6",
		terreno: "#dccaa6",
		residencial: "#e4d5b8",
		verde: "#b2d98e",
		verdeBorde: "#86bf65",
		deporte: "#9bd69a",
		cementerio: "#c1d7ad",
		educacion: "#e4d3f5",
		salud: "#f7cccc",
		agua: "#8fb0ad",
		aguaLinea: "#6f9894",
		aguaTexto: "#2f5f5b",
		edificioBorde: "#7d6f60",
		edificioSombra: "#5e5a4c",
		viaBorde: "#eee8d8",
		viaBordeMayor: "#e9e1cc",
		troncal: "#62686e",
		principal: "#71777d",
		secundaria: "#868b90",
		local: "#d7d4cb",
		cobBosque: "#7b8a52",
		cobCultivo: "#9fcb5c",
		cobPasto: "#c6bf86",
		cobMatorral: "#b2a674",
		cobDesnudo: "#d2ac80",
		cobHumedal: "#86b59f",
		arbol: "#3f6a2b",
		arbolBorde: "#2c4f1e",
		arbolSombra: "#2b2a1c",
		sendero: "#b98f62",
		senderoClaro: "#efdcbc",
		texto: "#2c3134",
		textoSecundario: "#565b52",
		rutaTexto: "#97560f",
		seleccion: "#0b66f5",
		sombra: "#4d5246",
		cielo: "#5aa9e6",
		horizonte: "#c6dbe8",
		techosColor: !0,
		saturacion: 1
	}),
	positron: P("Positron", {}),
	bright: P("Bright", {
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
		horizonte: "#f8f1e2",
		saturacion: .95
	}),
	liberty: P("Liberty", {
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
		horizonte: "#f5f0e4",
		saturacion: .9
	}),
	dark: P("Dark", {
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
		horizonte: "#22364a",
		cobBosque: "#133126",
		cobCultivo: "#1a3824",
		cobPasto: "#173323",
		cobMatorral: "#152f20",
		cobDesnudo: "#22292b",
		cobHumedal: "#113436",
		arbol: "#1d5a39",
		arbolBorde: "#113b25",
		arbolSombra: "#000000",
		ejeVia: "#cfd8df",
		noche: 1,
		saturacion: .8
	}),
	fjord: P("Fjord", {
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
		horizonte: "#e8f0f3",
		saturacion: .5
	}),
	mono: P("Monocromo", {
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
		opacidadVolumen: .72,
		cobBosque: "#dadada",
		cobCultivo: "#e6e6e6",
		cobPasto: "#e2e2e2",
		cobMatorral: "#dedede",
		cobDesnudo: "#ececec",
		cobHumedal: "#e0e0e0",
		arbol: "#a8a8a8",
		arbolBorde: "#8a8a8a",
		arbolSombra: "#777777",
		ejeViaPrincipal: "#ffffff",
		saturacion: 0
	})
};
// src/componentes/leyenda.tsx
function oe({ tema: e, vista: t, ciudad3d: n }) {
	let r = F[e].palette, i = r.techosColor ? [
		0,
		7,
		1,
		4,
		3,
		2,
		8
	].map((e) => ({
		label: k[e],
		color: O[e]
	})) : [{
		label: "Edificaciones",
		color: r.edificio
	}], a = [
		{
			title: r.techosColor ? "Techos" : "Edificios",
			items: i
		},
		{
			title: "Vías",
			items: [
				{
					label: "Carretera",
					color: r.troncal,
					shape: "line"
				},
				{
					label: "Avenida",
					color: r.principal,
					shape: "line"
				},
				{
					label: "Calle",
					color: r.local,
					shape: "line"
				}
			]
		},
		{
			title: "Áreas",
			items: [
				{
					label: "Árboles",
					color: r.arbol,
					shape: "dot"
				},
				{
					label: "Bosque",
					color: r.cobBosque
				},
				{
					label: "Cultivos y arrozales",
					color: r.cobCultivo
				},
				{
					label: "Parques",
					color: r.verde
				},
				{
					label: "Canchas",
					color: r.deporte
				},
				{
					label: "Colegios",
					color: r.educacion
				},
				{
					label: "Salud",
					color: r.salud
				},
				{
					label: "Ríos",
					color: r.agua
				}
			]
		},
		{
			title: "Lugares",
			items: [
				{
					label: "Comida",
					color: r.poiComida,
					shape: "dot"
				},
				{
					label: "Comercio",
					color: r.poiComercio,
					shape: "dot"
				},
				{
					label: "Salud",
					color: r.poiSalud,
					shape: "dot"
				},
				{
					label: "Educación",
					color: r.poiEducacion,
					shape: "dot"
				},
				{
					label: "Hospedaje",
					color: r.poiHospedaje,
					shape: "dot"
				},
				{
					label: "Iglesias y cultura",
					color: r.poiCultura,
					shape: "dot"
				},
				{
					label: "Ocio y deporte",
					color: r.poiOcio,
					shape: "dot"
				},
				{
					label: "Servicios públicos",
					color: r.poiServicio,
					shape: "dot"
				}
			]
		}
	];
	return /* @__PURE__ */ y("details", {
		className: "karto-legend",
		"data-testid": "karto-leyenda",
		children: [/* @__PURE__ */ v("summary", { children: "Leyenda" }), /* @__PURE__ */ y("div", {
			className: "karto-legend-body",
			children: [a.map((e) => /* @__PURE__ */ y("section", { children: [/* @__PURE__ */ v("h3", { children: e.title }), /* @__PURE__ */ v("ul", { children: e.items.map((e) => /* @__PURE__ */ y("li", { children: [/* @__PURE__ */ v("span", {
				className: `karto-legend-swatch karto-legend-${e.shape ?? "area"}`,
				style: { background: e.color },
				"aria-hidden": "true"
			}), e.label] }, e.label)) })] }, e.title)), t !== "2d" && n && /* @__PURE__ */ v("p", {
				className: "karto-legend-note",
				children: "Techos y paredes según el Censo 2017 (INEI) para las viviendas urbanas de Bagua: calamina o fibrocemento 67 %, concreto 29 %; ladrillo 49 %, adobe 45 %, quincha 4 %. Una y dos plantas. Árboles por satélite (Meta y WRI). Calles sin pavimentar, plazas, parques, estadio y canchas según OpenStreetMap; el resto del suelo varía por sector. La casa concreta, los postes, las bancas, las señales y los vehículos son representativos, no un levantamiento."
			})]
		})]
	});
}
// src/componentes/selector-estilo.tsx
function se({ tema: e, onCambio: t }) {
	return /* @__PURE__ */ y(b.Root, { children: [/* @__PURE__ */ y(b.Trigger, {
		className: "karto-style-trigger",
		"aria-label": `Estilo del mapa: ${F[e].label}`,
		children: [
			/* @__PURE__ */ v(d, {
				size: 16,
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ v("span", { children: F[e].label }),
			/* @__PURE__ */ v(c, {
				size: 14,
				"aria-hidden": "true"
			})
		]
	}), /* @__PURE__ */ v(b.Portal, { children: /* @__PURE__ */ y(b.Content, {
		className: "karto-style-menu",
		align: "start",
		sideOffset: 8,
		collisionPadding: 12,
		children: [
			/* @__PURE__ */ v(b.Label, {
				className: "karto-style-label",
				children: "Apariencia del mapa"
			}),
			/* @__PURE__ */ v(b.RadioGroup, {
				value: e,
				onValueChange: (e) => t(e),
				children: ie.map((e) => /* @__PURE__ */ y(b.RadioItem, {
					className: "karto-style-option",
					value: e,
					children: [
						/* @__PURE__ */ v("span", {
							className: `karto-style-swatch karto-swatch-${e}`,
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ v("span", { children: F[e].label }),
						/* @__PURE__ */ v(b.ItemIndicator, {
							className: "karto-style-check",
							children: /* @__PURE__ */ v(s, { size: 16 })
						})
					]
				}, e))
			}),
			/* @__PURE__ */ v("p", {
				className: "karto-style-note",
				children: "Overture Maps · cambia solo la apariencia"
			})
		]
	}) })] });
}
// src/config.ts
var ce = "/karto/", le = "bagua";
function I(e, t = ce) {
	let n = t.endsWith("/") ? t : `${t}/`;
	return new URL(`${n}${e}`, window.location.href).toString();
}
var ue = (e) => e ? `pmtiles://${I(`${e.ciudad.id}/teselas.pmtiles`, e.datos)}?v=${e.ciudad.revisionTeselas}` : `pmtiles://${I(`${le}/teselas.pmtiles`)}`, de = (e) => `${I("fuentes", e?.datos)}/{fontstack}/{range}.pbf`, L = (e) => I("maplibre-gl-worker.mjs", e), fe = (e) => e?.ciudad.atribucion ?? "© <a href=\"https://overturemaps.org\" target=\"_blank\" rel=\"noreferrer\">Overture Maps Foundation</a> · © OpenStreetMap (ODbL)", R = /* @__PURE__ */ new Map();
function z(e) {
	return R.has(e) || R.set(e, fetch(e).then((t) => {
		if (!t.ok) throw Error(`No se pudo leer ${e}`);
		return t.json();
	})), R.get(e);
}
function B(e, n = !0) {
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
		})), z(e).then((e) => t && a({
			datos: e,
			error: !1,
			cargando: !1
		})).catch(() => {
			R.delete(e), t && a({
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
var V = (e, t, n) => I(`${t}/${n}`, e), pe = (e, t) => B(V(e, t, "ciudad.json")), me = (e, t, n) => B(V(e, t, "alturas.geojson"), n), he = (e, t) => B(V(e, t, "complemento.geojson")), ge = (e, t) => B(V(e, t, "correcciones.json")), H = !1, U = !1;
async function _e(e) {
	let [t, n] = await Promise.all([import("maplibre-gl"), import("pmtiles")]);
	return U ||= (t.setWorkerUrl(e), !0), H ||= (t.addProtocol("pmtiles", new n.Protocol().tile), !0), t;
}
// src/mapa/ciudad/crowd.ts
var W = 6, G = 650, ve = class {
	w;
	buffer;
	walkers = [];
	random = Math.random;
	paths = [];
	nearby = [];
	nearbyWeights = [];
	center = [Infinity, Infinity];
	constructor(e, t = 650) {
		this.w = e;
		let n = this.paths;
		for (let t = 0; t + W <= e.index.length; t += W) {
			let [r, i, a, o, s, c] = Array.from(e.index.subarray(t, t + W)), l = new Float32Array(i);
			for (let t = 1; t < i; t++) {
				let n = (r + t - 1) * 2, i = (r + t) * 2;
				l[t] = l[t - 1] + Math.hypot(e.points[i] - e.points[n], e.points[i + 1] - e.points[n + 1]);
			}
			let u = l[i - 1] ?? 0;
			if (u < 4) continue;
			let d = (r + Math.floor(i / 2)) * 2;
			n.push({
				start: r,
				count: i,
				z: o,
				half: s,
				kind: c,
				cum: l,
				length: u,
				weight: a * (c === 3 ? 10 : c === 1 ? 6 : c === 2 ? 3 : 1),
				x: e.points[d],
				y: e.points[d + 1]
			});
		}
		if (this.nearby = n, this.nearbyWeights = n.map((e) => e.weight * e.length), n.length) for (let e = 0; e < t; e++) this.walkers.push(this.spawn());
		this.buffer = new Float32Array(this.walkers.length * 6), this.update(0);
	}
	spawn(e) {
		let t = this.nearbyWeights.reduce((e, t) => e + t, 0), n = this.random() * t, r = 0;
		for (; r < this.nearby.length - 1 && (n -= this.nearbyWeights[r]) > 0;) r++;
		let i = this.nearby[r] ?? this.paths[0], a = i.kind === 3, o = e ?? {};
		return o.path = i, o.s = this.random() * i.length, o.dir = this.random() < .5 ? 1 : -1, o.speed = a ? .55 + this.random() * .4 : 1.05 + this.random() * .45, o.pause = this.random() < (a ? .5 : .12) ? this.random() * 4 : 0, o.side = (this.random() * 2 - 1) * i.half, o.paint = Math.floor(this.random() * 8), o.scale = .92 + this.random() * .14, o;
	}
	follow(e, t) {
		if (Math.hypot(e - this.center[0], t - this.center[1]) < 120 || !this.paths.length) return;
		this.center = [e, t];
		let n = this.paths.filter((n) => Math.hypot(n.x - e, n.y - t) < G);
		if (n.length) {
			this.nearby = n, this.nearbyWeights = n.map((e) => e.weight * e.length);
			for (let n of this.walkers) Math.hypot(n.path.x - e, n.path.y - t) > G * 1.2 && this.spawn(n);
		}
	}
	get count() {
		return this.walkers.length;
	}
	update(e) {
		let t = this.w.points;
		this.walkers.forEach((n, r) => {
			let i = n.path, a = 1;
			n.pause > 0 ? (n.pause -= e, a = 0) : (n.s += n.dir * n.speed * e, n.s <= 0 || n.s >= i.length ? (n.s = Math.min(i.length, Math.max(0, n.s)), n.dir = n.dir === 1 ? -1 : 1, n.pause = .5 + this.random() * 2) : this.random() < e * (i.kind === 3 ? .35 : .03) && (n.pause = 1 + this.random() * (i.kind === 3 ? 5 : 3)));
			let o = 1;
			for (; o < i.count - 1 && i.cum[o] < n.s;) o++;
			let s = (i.start + o - 1) * 2, c = (i.start + o) * 2, l = i.cum[o] - i.cum[o - 1] || 1, u = (n.s - i.cum[o - 1]) / l, d = (t[c] - t[s]) / l, f = (t[c + 1] - t[s + 1]) / l, p = n.side, m = r * 6;
			this.buffer[m] = t[s] + (t[c] - t[s]) * u - f * p, this.buffer[m + 1] = t[s + 1] + (t[c + 1] - t[s + 1]) * u + d * p, this.buffer[m + 2] = i.z, this.buffer[m + 3] = n.scale, this.buffer[m + 4] = Math.atan2(f * n.dir, d * n.dir), this.buffer[m + 5] = n.paint + 8 * a;
		});
	}
}, K = class {
	data = [];
	push(e, t, n, r) {
		this.data.push(e[0], e[1], e[2], t[0], t[1], t[2], n[0], n[1], n[2], r);
	}
	tri(e, t, n, r, i, a) {
		let o = a ?? ye(e, t, n);
		this.push(e, o, r, i), this.push(t, o, r, i), this.push(n, o, r, i);
	}
	quad(e, t, n, r, i, a) {
		this.tri(e, t, n, i, a), this.tri(e, n, r, i, a);
	}
	box(e, t, n, r, i, a, o, s = 0) {
		let c = N(o), l = (e, t, n) => [
			e,
			t,
			n
		];
		this.quad(l(e, t, a), l(r, t, a), l(r, i, a), l(e, i, a), c, s), this.quad(l(e, i, n), l(r, i, n), l(r, t, n), l(e, t, n), c, s), this.quad(l(r, t, n), l(r, i, n), l(r, i, a), l(r, t, a), c, s), this.quad(l(e, i, n), l(e, t, n), l(e, t, a), l(e, i, a), c, s), this.quad(l(e, t, n), l(r, t, n), l(r, t, a), l(e, t, a), c, s), this.quad(l(r, i, n), l(e, i, n), l(e, i, a), l(r, i, a), c, s);
	}
	cylinderZ(e, t, n, r, i, a, o = 0, s = 8) {
		let c = N(a);
		for (let a = 0; a < s; a++) {
			let l = a / s * Math.PI * 2, u = (a + 1) / s * Math.PI * 2, d = [
				e + Math.cos(l) * n,
				t + Math.sin(l) * n,
				r
			], f = [
				e + Math.cos(u) * n,
				t + Math.sin(u) * n,
				r
			], p = [
				Math.cos(l),
				Math.sin(l),
				0
			], m = [
				Math.cos(u),
				Math.sin(u),
				0
			], h = [
				d[0],
				d[1],
				i
			], g = [
				f[0],
				f[1],
				i
			];
			this.push(d, p, c, o), this.push(f, m, c, o), this.push(g, m, c, o), this.push(d, p, c, o), this.push(g, m, c, o), this.push(h, p, c, o), this.tri([
				e,
				t,
				i
			], h, g, c, o, [
				0,
				0,
				1
			]);
		}
	}
	wheel(e, t, n, r, i) {
		let a = N("#1b1b1b");
		for (let o = 0; o < 10; o++) {
			let s = o / 10 * Math.PI * 2, c = (o + 1) / 10 * Math.PI * 2, l = (t, i) => [
				e + Math.cos(t) * r,
				i,
				n + Math.sin(t) * r
			], u = t - i / 2, d = t + i / 2;
			this.quad(l(s, u), l(c, u), l(c, d), l(s, d), a, 0), this.tri([
				e,
				d,
				n
			], l(s, d), l(c, d), a, 0), this.tri([
				e,
				u,
				n
			], l(c, u), l(s, u), a, 0);
		}
	}
	cone(e, t, n, r, i, a = 9) {
		let o = N(i);
		for (let i = 0; i < a; i++) {
			let s = i / a * Math.PI * 2, c = (i + 1) / a * Math.PI * 2;
			this.tri([
				e + Math.cos(s) * n,
				t + Math.sin(s) * n,
				0
			], [
				e + Math.cos(c) * n,
				t + Math.sin(c) * n,
				0
			], [
				e,
				t,
				r
			], o, 0);
		}
	}
	plate(e, t, n, r, i, a, o = "#8d9092") {
		let s = N(a), c = N(o);
		for (let a = 0; a < i; a++) {
			let o = a / i * Math.PI * 2 + Math.PI / i, l = (a + 1) / i * Math.PI * 2 + Math.PI / i, u = [
				e,
				t + Math.cos(o) * r,
				n + Math.sin(o) * r
			], d = [
				e,
				t + Math.cos(l) * r,
				n + Math.sin(l) * r
			];
			this.tri([
				e,
				t,
				n
			], d, u, s, 0, [
				1,
				0,
				0
			]), this.tri([
				e - .02,
				t,
				n
			], [
				u[0] - .02,
				u[1],
				u[2]
			], [
				d[0] - .02,
				d[1],
				d[2]
			], c, 0, [
				-1,
				0,
				0
			]);
		}
	}
	build() {
		return new Float32Array(this.data);
	}
};
function ye(e, t, n) {
	let r = [
		t[0] - e[0],
		t[1] - e[1],
		t[2] - e[2]
	], i = [
		n[0] - e[0],
		n[1] - e[1],
		n[2] - e[2]
	], a = [
		r[1] * i[2] - r[2] * i[1],
		r[2] * i[0] - r[0] * i[2],
		r[0] * i[1] - r[1] * i[0]
	], o = Math.hypot(...a) || 1;
	return [
		a[0] / o,
		a[1] / o,
		a[2] / o
	];
}
function be(e, t, n = !0) {
	let r = (1 + Math.sqrt(5)) / 2, i = [
		[
			-1,
			r,
			0
		],
		[
			1,
			r,
			0
		],
		[
			-1,
			-r,
			0
		],
		[
			1,
			-r,
			0
		],
		[
			0,
			-1,
			r
		],
		[
			0,
			1,
			r
		],
		[
			0,
			-1,
			-r
		],
		[
			0,
			1,
			-r
		],
		[
			r,
			0,
			-1
		],
		[
			r,
			0,
			1
		],
		[
			-r,
			0,
			-1
		],
		[
			-r,
			0,
			1
		]
	], a = [
		[
			0,
			11,
			5
		],
		[
			0,
			5,
			1
		],
		[
			0,
			1,
			7
		],
		[
			0,
			7,
			10
		],
		[
			0,
			10,
			11
		],
		[
			1,
			5,
			9
		],
		[
			5,
			11,
			4
		],
		[
			11,
			10,
			2
		],
		[
			10,
			7,
			6
		],
		[
			7,
			1,
			8
		],
		[
			3,
			9,
			4
		],
		[
			3,
			4,
			2
		],
		[
			3,
			2,
			6
		],
		[
			3,
			6,
			8
		],
		[
			3,
			8,
			9
		],
		[
			4,
			9,
			5
		],
		[
			2,
			4,
			11
		],
		[
			6,
			2,
			10
		],
		[
			8,
			6,
			7
		],
		[
			9,
			8,
			1
		]
	], o = (e) => {
		let t = Math.hypot(...e);
		return [
			e[0] / t,
			e[1] / t,
			e[2] / t
		];
	};
	i = i.map(o);
	let s = /* @__PURE__ */ new Map(), c = (e, t) => {
		let n = e < t ? `${e}_${t}` : `${t}_${e}`, r = s.get(n);
		if (r !== void 0) return r;
		let a = i[e], c = i[t];
		return i.push(o([
			(a[0] + c[0]) / 2,
			(a[1] + c[1]) / 2,
			(a[2] + c[2]) / 2
		])), s.set(n, i.length - 1), i.length - 1;
	};
	n && (a = a.flatMap(([e, t, n]) => {
		let r = c(e, t), i = c(t, n), a = c(n, e);
		return [
			[
				e,
				r,
				a
			],
			[
				t,
				i,
				r
			],
			[
				n,
				a,
				i
			],
			[
				r,
				i,
				a
			]
		];
	}));
	let l = [
		1,
		1,
		1
	];
	for (let [n, r, o] of a) {
		let a = i[n], s = i[r], c = i[o];
		e.data.push(...a, ...a, ...l, t, ...s, ...s, ...l, t, ...c, ...c, ...l, t);
	}
}
function xe() {
	let e = new K();
	return e.cylinderZ(0, 0, 1, 0, 1, "#ffffff", 0, 4), be(e, 1, !1), e.build();
}
function Se() {
	let e = new K();
	e.cylinderZ(0, 0, 1, 0, 1, "#ffffff", 0, 4);
	let t = [
		1,
		1,
		1
	];
	for (let n = 0; n < 5; n++) {
		let r = n / 5 * Math.PI * 2, i = Math.cos(r), a = Math.sin(r), o = (e, t) => {
			let n = (.14 * Math.sin(Math.PI * Math.min(e, .9)) + .03) * t;
			return [
				e * i - n * a,
				e * a + n * i,
				.3 * e - .75 * e * e
			];
		};
		e.quad(o(0, -1), o(.5, -1), o(.5, 1), o(0, 1), t, 2), e.quad(o(.5, -1), o(1, -1), o(1, 1), o(.5, 1), t, 2);
	}
	return e.build();
}
function Ce() {
	let e = new K(), t = "#2f3a4d", n = "#a87253";
	return e.box(-.08, .02, 0, .08, .15, .86, t, 7), e.box(-.08, -.15, 0, .08, -.02, .86, t, 8), e.box(-.11, -.19, .84, .11, .19, 1.4, "#ffffff", 4), e.box(-.06, .19, .9, .06, .27, 1.38, n, 9), e.box(-.06, -.27, .9, .06, -.19, 1.38, n, 10), e.box(-.09, -.09, 1.4, .1, .09, 1.6, n), e.box(-.11, -.1, 1.56, .09, .1, 1.67, "#1d1714"), e.build();
}
function we() {
	let e = new K();
	return e.cylinderZ(0, 0, 1, 0, 1, "#ffffff", 0, 6), be(e, 1), e.build();
}
function Te() {
	let e = new K();
	e.cylinderZ(0, 0, 1, 0, 1, "#ffffff", 0, 6);
	let t = [
		1,
		1,
		1
	];
	for (let n = 0; n < 9; n++) {
		let r = n / 9 * Math.PI * 2 + n % 2 * .2, i = Math.cos(r), a = Math.sin(r), o = (e, t) => {
			let n = (.16 * Math.sin(Math.PI * e) + .015) * t, r = e, o = .3 * e - .75 * e * e;
			return [
				r * i - n * a,
				r * a + n * i,
				o
			];
		};
		for (let n = 0; n < 4; n++) {
			let r = n / 4, i = (n + 1) / 4;
			e.quad(o(r, -1), o(i, -1), o(i, 1), o(r, 1), t, 2);
		}
	}
	return e.build();
}
function q() {
	let e = new K();
	return e.wheel(.68, 0, .3, .3, .11), e.wheel(-.68, 0, .3, .3, .13), e.box(-.6, -.13, .32, .5, .13, .62, "#ff00ff", 1), e.box(.15, -.16, .6, .58, .16, .86, "#ff00ff", 1), e.box(-.62, -.15, .7, .12, .15, .82, "#151515"), e.box(.55, -.36, .95, .6, .36, 1, "#2b2b2b"), e.box(.6, -.06, .78, .66, .06, .9, "#fffbe6", 2), e.box(-.66, -.07, .62, -.6, .07, .7, "#ff2a2a", 5), e.box(-.32, -.2, .8, .14, .2, .98, "#2f4f7a"), e.box(-.3, -.2, .98, -.02, .2, 1.5, "#ffffff", 4), e.box(-.24, -.13, 1.5, .02, .13, 1.78, "#1c1c1c"), e.build();
}
function Ee() {
	let e = new K();
	e.wheel(1.08, 0, .26, .26, .12), e.wheel(-.72, .56, .27, .27, .14), e.wheel(-.72, -.56, .27, .27, .14), e.box(.5, -.17, .34, 1.22, .17, .84, "#ff00ff", 1), e.box(.95, -.4, 1, 1, .4, 1.05, "#2b2b2b"), e.box(1.2, -.07, .68, 1.26, .07, .8, "#fffbe6", 2), e.box(.3, -.2, .85, .62, .2, 1.38, "#ffffff", 4), e.box(.34, -.13, 1.38, .58, .13, 1.64, "#1c1c1c"), e.box(-1.15, -.62, .3, .45, .62, .55, "#262626"), e.box(-1.15, -.62, .55, -.92, .62, 1.25, "#ff00ff", 1), e.box(-.92, .57, .55, .3, .62, .95, "#ff00ff", 1), e.box(-.92, -.62, .55, .3, -.57, .95, "#ff00ff", 1), e.box(-.9, -.55, .55, -.42, .55, .85, "#6b1d1d"), e.box(-1.22, -.68, 1.7, .78, .68, 1.82, "#ff00ff", 1);
	for (let t of [-1.15, .7]) for (let n of [-.62, .58]) e.box(t, n, .9, t + .05, n + .04, 1.71, "#222222");
	return e.box(.72, -.52, 1.02, .76, .52, 1.66, "#9ec5d8", 3), e.box(-1.2, .3, .6, -1.16, .5, .7, "#ff2a2a", 5), e.box(-1.2, -.5, .6, -1.16, -.3, .7, "#ff2a2a", 5), e.build();
}
function De() {
	let e = new K();
	for (let t of [1.35, -1.35]) for (let n of [.78, -.78]) e.wheel(t, n, .32, .32, .22);
	return e.box(-2.1, -.86, .32, 2.1, .86, .86, "#ff00ff", 1), e.box(-1.05, -.8, .86, .85, .8, 1.36, "#33424f", 3), e.box(-.95, -.78, 1.36, .75, .78, 1.44, "#ff00ff", 1), e.box(2.08, .5, .6, 2.12, .78, .72, "#fffbe6", 2), e.box(2.08, -.78, .6, 2.12, -.5, .72, "#fffbe6", 2), e.box(-2.12, .5, .62, -2.08, .8, .72, "#ff2a2a", 5), e.box(-2.12, -.8, .62, -2.08, -.5, .72, "#ff2a2a", 5), e.build();
}
function Oe() {
	let e = new K();
	return e.cylinderZ(0, 0, .55, 0, 1.25, "#ff00ff", 1, 10), e.cylinderZ(0, 0, .24, 1.25, 1.33, "#ff00ff", 1, 8), e.build();
}
function ke() {
	let e = new K();
	e.box(-.13, -.13, 0, .13, .13, .32, "#a19d95");
	for (let t of [-.07, .05]) for (let n of [-.07, .05]) e.box(t, n, .32, t + .025, n + .025, 1.05, "#6b4430");
	return e.build();
}
function Ae(e) {
	let t = new K(), n = "#aaa59b";
	t.box(-.15, -.15, 0, .15, .15, 3, n), t.box(-.12, -.12, 3, .12, .12, 6, n), t.box(-.09, -.09, 6, .09, .09, 9, n), t.box(-.06, -.8, 7.95, .06, .8, 8.08, "#6a5a48");
	for (let e of [
		-.65,
		0,
		.65
	]) t.box(-.04, e - .04, 8.08, .04, e + .04, 8.22, "#d9d6cf");
	return t.box(-.13, -.05, 6.65, .13, .25, 6.9, "#4a4a4a"), e === "lamp" && (t.box(-.04, 0, 7.25, .04, 1.7, 7.33, "#7a7a7a"), t.box(-.14, 1.45, 7.06, .14, 1.9, 7.25, "#ffe2a8", 2)), e === "trafo" && (t.cylinderZ(0, -.42, .3, 5.3, 6.3, "#8c9196", 0, 8), t.box(-.05, -.2, 5.6, .05, -.1, 5.9, "#4a4a4a")), t.build();
}
function je() {
	let e = new K();
	return e.quad([
		-1,
		-1,
		0
	], [
		1,
		-1,
		0
	], [
		1,
		1,
		0
	], [
		-1,
		1,
		0
	], [
		1,
		1,
		1
	], 0), e.build();
}
function Me() {
	let e = new K();
	return e.cone(-.9, 0, .95, .75, "#c9a46a"), e.cone(.6, .2, .75, .55, "#8d8b86"), e.box(-.2, -.95, 0, .7, -.35, .55, "#b0553a"), e.box(-.15, -.9, .55, .6, -.4, .7, "#a24c33"), e.build();
}
// src/mapa/ciudad/shaders.ts
var J = {
	pos: 0,
	normal: 1,
	uv: 2,
	info: 3,
	style: 4,
	id: 5,
	color: 2,
	ia: 6,
	ib: 7
}, Ne = "#version 300 es\nprecision highp float;\nprecision highp int;\n", Pe = "\nuniform highp sampler2DShadow u_shadow;\nuniform mat4 u_light;\nuniform float u_shadow_on;\nuniform vec3 u_sun;\nuniform vec3 u_eye;\nuniform float u_night;\nuniform vec3 u_fog_color;\nuniform vec2 u_fog;\nuniform float u_saturation;\n\nfloat hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat rect(vec2 p, vec2 lo, vec2 hi, vec2 aa) {\n  vec2 a = smoothstep(lo - aa, lo + aa, p) * (1.0 - smoothstep(hi - aa, hi + aa, p));\n  return a.x * a.y;\n}\nfloat lines(float x, float period, float w, float aa) {\n  float d = abs(fract(x / period + 0.5) - 0.5) * period;\n  return 1.0 - smoothstep(w - aa, w + aa, d);\n}\nfloat shadowAt(vec3 p, vec3 n) {\n  if (u_shadow_on < 0.5) return 1.0;\n  vec4 lp = u_light * vec4(p + n * 0.08, 1.0);\n  vec3 c = lp.xyz / lp.w * 0.5 + 0.5;\n  if (c.x <= 0.0 || c.y <= 0.0 || c.x >= 1.0 || c.y >= 1.0 || c.z >= 1.0) return 1.0;\n  vec2 texel = 1.0 / vec2(textureSize(u_shadow, 0));\n  float s = 0.0;\n  for (int i = -1; i <= 1; i++)\n    for (int j = -1; j <= 1; j++)\n      s += texture(u_shadow, vec3(c.xy + vec2(float(i), float(j)) * texel * 1.2, c.z - 0.0006));\n  s /= 9.0;\n  vec2 edge = smoothstep(vec2(0.0), vec2(0.08), c.xy) * smoothstep(vec2(0.0), vec2(0.08), 1.0 - c.xy);\n  return mix(1.0, s, edge.x * edge.y);\n}\nvec3 lit(vec3 albedo, vec3 n, vec3 p, float ao, float gloss) {\n  float sh = shadowAt(p, n);\n  float ndl = max(dot(n, u_sun), 0.0);\n  vec3 sunC = mix(vec3(1.0, 0.95, 0.86), vec3(0.32, 0.38, 0.58), u_night);\n  vec3 skyC = mix(vec3(0.6, 0.72, 0.88), vec3(0.26, 0.32, 0.5), u_night);\n  vec3 grdC = mix(vec3(0.58, 0.48, 0.37), vec3(0.12, 0.11, 0.14), u_night);\n  vec3 amb = mix(grdC, skyC, n.z * 0.5 + 0.5) * ao;\n  vec3 col = albedo * (amb * 0.56 + sunC * ndl * sh * mix(0.86, 0.35, u_night));\n  vec3 v = normalize(u_eye - p);\n  vec3 h = normalize(v + u_sun);\n  col += sunC * pow(max(dot(n, h), 0.0), 64.0) * gloss * sh * (1.0 - u_night);\n  return col;\n}\nvec3 finish(vec3 col, vec3 p) {\n  float l = dot(col, vec3(0.299, 0.587, 0.114));\n  // Color vivo de día (sol de Bagua); de noche se apaga.\n  col = mix(vec3(l), col, u_saturation * mix(1.15, 1.0, u_night));\n  float f = smoothstep(u_fog.x, u_fog.y, distance(u_eye, p));\n  return mix(col, u_fog_color, f * 0.72);\n}\n", Fe = "\nlayout(location = 0) in vec3 a_pos;\nlayout(location = 1) in vec3 a_normal;\nlayout(location = 2) in vec2 a_uv;\nlayout(location = 3) in vec4 a_info;\nlayout(location = 4) in float a_style;\nlayout(location = 5) in float a_id;\nuniform mat4 u_matrix;\nuniform float u_rise;\nout vec3 v_pos;\nout vec3 v_normal;\nout vec2 v_uv;\nout vec4 v_info;\nflat out float v_style;\nflat out float v_id;\nvoid main() {\n  // Cada edificio sube desde el suelo con un desfase propio: la ciudad se levanta en ~1 s.\n  float t = clamp((u_rise - a_info.w * 0.4) / 0.6, 0.0, 1.0);\n  float grow = 1.0 - pow(1.0 - t, 3.0);\n  vec3 p = vec3(a_pos.xy, a_pos.z * grow);\n  v_pos = p;\n  v_normal = a_normal;\n  v_uv = abs(a_normal.z) < 0.5 ? vec2(a_uv.x, a_uv.y * grow) : a_uv;\n  v_info = a_info;\n  v_style = a_style;\n  v_id = a_id;\n  gl_Position = u_matrix * vec4(p, 1.0);\n}", Ie = "\nin vec3 v_pos;\nin vec3 v_normal;\nin vec2 v_uv;\nin vec4 v_info;\nflat in float v_style;\nflat in float v_id;\nuniform vec3 u_facade[16];\nuniform vec3 u_roof[9];\nuniform vec3 u_sign[6];\nuniform float u_selected;\nuniform vec3 u_selection;\nuniform float u_hide_simulated;\nout vec4 fragColor;\n\nvec3 glass(vec3 n, vec3 p, float seed, float litW, out float gloss) {\n  vec3 v = normalize(u_eye - p);\n  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);\n  vec3 tint = seed < 0.3 ? vec3(0.1, 0.22, 0.34) : seed < 0.5 ? vec3(0.12, 0.27, 0.22) : seed < 0.68 ? vec3(0.26, 0.19, 0.12) : vec3(0.16, 0.22, 0.28);\n  vec3 day = mix(tint, vec3(0.6, 0.76, 0.92), clamp(fres * 0.9 + seed * 0.2, 0.0, 1.0));\n  vec3 warm = mix(vec3(1.0, 0.78, 0.45), vec3(0.62, 0.78, 1.0), step(0.8, seed));\n  vec3 night = mix(vec3(0.04, 0.05, 0.08), warm, litW);\n  gloss = 1.6 * (1.0 - u_night);\n  return mix(day, night, u_night);\n}\n\nvoid main() {\n  float st = v_style;\n  float facade = mod(st, 16.0);\n  int material = int(mod(floor(st / 16.0), 8.0));\n  int roofI = int(mod(floor(st / 128.0), 16.0));\n  float flags = floor(st / 2048.0);\n  bool simulated = mod(flags, 2.0) > 0.5;\n  bool unfinished = mod(floor(flags / 2.0), 2.0) > 0.5;\n  bool shop = mod(floor(flags / 4.0), 2.0) > 0.5;\n  bool upper = mod(floor(flags / 8.0), 2.0) > 0.5;\n  bool meter = mod(floor(flags / 16.0), 2.0) > 0.5;\n  bool earth = mod(floor(flags / 32.0), 2.0) > 0.5;\n  bool front = mod(floor(flags / 64.0), 2.0) > 0.5;\n  if (u_hide_simulated > 0.5 && simulated) discard;\n  vec3 n = normalize(v_normal);\n  bool roof = n.z > 0.5;\n  vec2 aa = max(fwidth(v_uv), vec2(1e-4));\n  float px = max(aa.x, aa.y);\n  float detail = 1.0 - smoothstep(0.14, 0.42, px);\n  float fine = 1.0 - smoothstep(0.035, 0.09, px);\n  float seed = v_info.w;\n  vec3 color;\n  float gloss = 0.0;\n  float emissive = 0.0;\n  float ao = 1.0;\n\n  if (roof) {\n    color = u_roof[roofI];\n    vec2 r = v_uv;\n    if (roofI == 7) {\n      // Fibrocemento: ondas anchas de 0,18 m, planchas de 1,1 × 2,4 m y líquenes.\n      vec2 sheet = floor(r / vec2(1.1, 2.4));\n      color *= 0.9 + 0.1 * sin(r.x * 34.9) * fine;\n      color *= 0.92 + 0.1 * hash1(sheet + seed * 17.0) * detail;\n      color = mix(color, vec3(0.48, 0.5, 0.42), 0.35 * smoothstep(0.6, 1.0, hash1(floor(r / 0.7) + seed)) * detail);\n      color *= 1.0 - 0.08 * lines(r.y, 2.4, 0.03, aa.y) * detail;\n    } else if (roofI == 8) {\n      // Caña o estera: fibras trenzadas.\n      float weave = step(0.5, fract(floor(r.x / 0.12) * 0.5 + floor(r.y / 0.12) * 0.5));\n      color *= 0.82 + 0.22 * weave * fine + 0.08 * hash1(floor(r / 0.6) + seed) * detail;\n    } else if (roofI == 0 || roofI == 1 || roofI == 4 || roofI == 6) {\n      // Calamina: ondas cada 0,18 m, planchas de 0,9 × 1,8 m de distinto desgaste.\n      vec2 sheet = floor(r / vec2(0.9, 1.8));\n      color *= 0.9 + 0.12 * hash1(sheet + seed * 31.0) * detail;\n      if (roofI == 1) color = mix(color, color * vec3(0.78, 0.62, 0.5), 0.55 * hash1(sheet * 1.7 + 3.0));\n      color *= 0.92 + 0.08 * sin(r.x * 34.9) * fine;\n      color *= 1.0 - 0.1 * lines(r.y, 1.8, 0.03, aa.y) * detail;\n      gloss = roofI == 0 ? 0.55 : 0.25;\n    } else if (roofI == 2) {\n      float row = floor(r.y / 0.32);\n      color *= 0.86 + 0.14 * smoothstep(0.0, 0.32, mod(r.y, 0.32)) * fine;\n      color *= 1.0 - 0.12 * lines(r.x + mod(row, 2.0) * 0.11, 0.22, 0.012, aa.x) * fine;\n      color *= 0.92 + 0.12 * hash1(vec2(floor((r.x + mod(row, 2.0) * 0.11) / 0.22), row)) * fine;\n    } else {\n      // Losa: paños, juntas y manchas de humedad.\n      color *= 0.95 + 0.07 * hash1(floor(v_pos.xy / 2.5)) * detail;\n      color *= 1.0 - 0.07 * max(lines(r.x, 2.5, 0.02, aa.x), lines(r.y, 2.5, 0.02, aa.y)) * detail;\n      float stain = smoothstep(0.62, 0.95, hash1(floor(v_pos.xy / 1.4) + seed * 7.0)) * detail;\n      color = mix(color, color * vec3(0.72, 0.76, 0.7), stain * 0.6);\n    }\n  } else {\n    float len = v_info.x;\n    float eave = v_info.y;\n    float floors = v_info.z;\n    float u = v_uv.x;\n    float v = v_uv.y;\n    float fh = max(2.4, (eave - 0.1) / floors);\n    float fl = min(floor(v / fh), floors - 1.0);\n    float fv = v - fl * fh;\n    int mat = material;\n    if (unfinished && fl >= 1.0) mat = 1;\n    color = u_facade[int(facade)];\n    if (mat == 1) {\n      color = u_facade[0];\n      float row = floor(v / 0.2);\n      float off = mod(row, 2.0) * 0.12;\n      float mortar = max(lines(v, 0.2, 0.012, aa.y), lines(u + off, 0.24, 0.012, aa.x));\n      color *= 0.9 + 0.16 * hash1(vec2(floor((u + off) / 0.24), row) + seed) * fine;\n      color = mix(color, vec3(0.78, 0.72, 0.64), mortar * 0.7 * fine);\n      // Columnas cada ~3,5 m, en las esquinas y viga de concreto en cada piso.\n      float colW = 0.25;\n      float ccount = max(1.0, floor(len / 3.5 + 0.5));\n      float cpos = abs(fract(u / (len / ccount) + 0.5) - 0.5) * (len / ccount);\n      float column = 1.0 - smoothstep(colW - aa.x, colW + aa.x, min(cpos, min(u, len - u)));\n      float beam = 1.0 - smoothstep(0.28 - aa.y, 0.28 + aa.y, fv);\n      vec3 concreteC = vec3(0.64, 0.62, 0.58) * (0.92 + 0.1 * hash1(floor(vec2(u, v) / 0.6) + seed));\n      color = mix(color, concreteC, max(column, beam * step(0.5, fl + float(unfinished))) * detail);\n    } else if (mat == 2) {\n      // Madera: tablas verticales de 0,2 m con vetas.\n      float plank = floor(u / 0.2);\n      color = vec3(0.47, 0.32, 0.2) * (0.82 + 0.25 * hash1(vec2(plank, seed * 9.0)));\n      color *= 1.0 - 0.35 * lines(u, 0.2, 0.012, aa.x) * fine;\n      color *= 0.95 + 0.05 * sin(v * 23.0 + plank * 3.0) * fine;\n    } else if (mat == 3) {\n      // Adobe con revoque de barro.\n      color = vec3(0.71, 0.55, 0.4) * (0.9 + 0.14 * hash1(floor(vec2(u, v) / 0.35) + seed));\n      color *= 1.0 - 0.1 * max(lines(v, 0.42, 0.015, aa.y), lines(u + mod(floor(v / 0.42), 2.0) * 0.3, 0.6, 0.015, aa.x)) * fine;\n    } else if (mat == 4) {\n      color = vec3(0.68, 0.67, 0.64) * (0.94 + 0.08 * hash1(floor(vec2(u / 1.2, v / 0.6)) + seed));\n      color *= 1.0 - 0.08 * lines(v, 0.6, 0.012, aa.y) * fine;\n    } else if (mat == 5) {\n      // Quincha: caña y barro entre pies derechos de madera.\n      color = vec3(0.72, 0.59, 0.45) * (0.9 + 0.12 * hash1(floor(vec2(u, v) / 0.3) + seed));\n      color = mix(color, vec3(0.4, 0.28, 0.18), lines(u, 1.2, 0.06, aa.x) * fine);\n      color = mix(color, vec3(0.4, 0.28, 0.18), lines(v, 2.6, 0.05, aa.y) * fine);\n    } else if (mat == 6) {\n      // Calamina como pared: ondas verticales y óxido abajo.\n      color = vec3(0.6, 0.63, 0.65) * (0.9 + 0.1 * sin(u * 34.9) * fine);\n      color = mix(color, vec3(0.55, 0.33, 0.22), 0.5 * (1.0 - smoothstep(0.0, 1.2, v)));\n    } else if (mat == 7) {\n      // Estera de caña tejida sobre parantes.\n      float weave = step(0.5, fract(floor(u / 0.1) * 0.5 + floor(v / 0.1) * 0.5));\n      color = vec3(0.68, 0.56, 0.36) * (0.82 + 0.2 * weave * fine);\n      color = mix(color, vec3(0.38, 0.27, 0.17), lines(u, 1.5, 0.05, aa.x) * fine);\n    } else {\n      // Revoque pintado con zócalo oscuro y desgaste.\n      color = mix(color * 0.72, color, smoothstep(0.42 - aa.y, 0.42 + aa.y, v));\n      color *= 0.95 + 0.06 * hash1(floor(vec2(u, v) / 0.8) + seed) * detail;\n      // Sobre adobe el tarrajeo se cuartea y deja ver el barro en parches.\n      if (earth) {\n        float crack = smoothstep(0.78, 0.92, hash1(floor(vec2(u / 0.9, v / 0.6)) + seed * 3.0));\n        crack *= 1.0 - smoothstep(0.6, 2.2, v) * 0.6;\n        color = mix(color, vec3(0.66, 0.54, 0.4), crack * detail);\n      }\n    }\n    // Iglesia: pilastras en las esquinas, zócalo y cornisa blancos.\n    if (facade > 12.5 && facade < 13.5) {\n      float pil = 1.0 - smoothstep(0.5 - aa.x, 0.5 + aa.x, min(u, len - u));\n      float mid = lines(u, max(3.5, len / max(1.0, floor(len / 4.0))), 0.18, aa.x);\n      float corn = step(eave - 0.75, v) * step(v, eave);\n      float base = 1.0 - smoothstep(0.7 - aa.y, 0.7 + aa.y, v);\n      color = mix(color, vec3(0.96, 0.95, 0.91), max(max(pil, mid), max(corn, base)) * detail);\n    }\n    // Institucional (hospital, clínica): franja azul bajo las ventanas de cada piso.\n    if (facade > 13.5 && facade < 14.5)\n      color = mix(color, vec3(0.13, 0.36, 0.64), (step(0.5, fv) - step(0.8, fv)) * detail);\n    // Chorreado bajo la cornisa y suciedad junto al suelo.\n    color *= 1.0 - 0.1 * smoothstep(0.3, 0.0, eave - v) * detail;\n    color *= 1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.6, v)) * (0.5 + 0.5 * hash1(vec2(floor(u / 0.5), seed)));\n    // Losa entre pisos y cornisa.\n    if (fl >= 1.0) color *= 1.0 - 0.2 * (1.0 - smoothstep(0.14 - aa.y, 0.14 + aa.y, fv)) * detail;\n    color *= 1.0 - 0.16 * smoothstep(eave - 0.2 - aa.y, eave - 0.2 + aa.y, v) * step(v, eave) * detail;\n    float cells = max(1.0, floor(len / 2.8));\n    float cw = len / cells;\n    float ci = floor(u / cw);\n    float cu = u - ci * cw;\n    float r = hash1(vec2(ci + seed * 97.0, fl + seed * 13.0));\n    float litW = step(0.5, hash1(vec2(ci * 3.1 + seed * 41.0, fl)));\n    bool curtain = facade > 14.5 && facade < 15.5;\n    if (curtain && !upper) {\n      float lw = step(0.5, hash1(vec2(floor(u / 1.5), fl + seed)));\n      float gg;\n      vec3 g = glass(n, v_pos, 0.12, lw, gg);\n      float centro = step(len * 0.32, u) * step(u, len * 0.68);\n      vec3 cielo = mix(g, vec3(0.6, 0.73, 0.84), 0.6 * (1.0 - u_night));\n      if (centro > 0.5 && fl >= 0.5) {\n        // Muro cortina: vidrio claro que refleja el cielo, paños de 1,5 m con perfiles de aluminio.\n        float mull = max(lines(u, 1.5, 0.05, aa.x), lines(fv, fh, 0.1, aa.y));\n        color = mix(cielo, vec3(0.82, 0.84, 0.86), mull * fine);\n        gloss = max(gloss, gg);\n        emissive += lw * u_night * 0.8;\n      } else {\n        // Alas crema con ventana corrida azul por piso y columna azul en la esquina.\n        color = vec3(0.93, 0.85, 0.62) * (0.96 + 0.05 * hash1(floor(vec2(u, v) / 0.9) + seed));\n        float banda = (step(1.05, fv) - step(1.85, fv)) * step(0.5, fl);\n        color = mix(color, mix(vec3(0.22, 0.42, 0.7), g, 0.4), banda);\n        gloss = max(gloss, gg * banda);\n        emissive += banda * lw * u_night * 0.7;\n        float columna = 1.0 - smoothstep(1.6 - aa.x, 1.6 + aa.x, u);\n        color = mix(color, vec3(0.12, 0.34, 0.7), columna);\n      }\n      // Columnas azules que enmarcan el muro cortina, de piso a techo.\n      float marco = (1.0 - smoothstep(0.7 - aa.x, 0.7 + aa.x, abs(u - len * 0.32))) +\n                    (1.0 - smoothstep(0.7 - aa.x, 0.7 + aa.x, abs(u - len * 0.68)));\n      color = mix(color, vec3(0.12, 0.34, 0.7), clamp(marco, 0.0, 1.0));\n      // Planta baja: ingreso con pórtico gris y cornisa blanca arriba.\n      if (fl < 0.5) color = mix(vec3(0.62, 0.62, 0.6), g, step(0.5, fract(u / 3.0)) * step(fv, 2.3));\n      color = mix(color, vec3(0.96, 0.96, 0.94), step(eave - 0.45, v) * step(v, eave));\n    }\n    // Hospital EsSalud (Héroes del Cenepa, fotografías 2025-2026): azul con franjas blancas.\n    if (facade > 11.5 && facade < 12.5 && !upper) {\n      float losa = 1.0 - smoothstep(0.3 - aa.y, 0.3 + aa.y, fv);\n      color = mix(color, vec3(0.96, 0.96, 0.95), losa * step(0.5, fl) * detail);\n      color = mix(color, vec3(0.96, 0.96, 0.95), step(eave - 0.6, v) * step(v, eave));\n    }\n    // Comisaría PNP: verde menta con franjas verde oscuro en cada losa y letrero blanco.\n    if (facade > 10.5 && facade < 11.5 && !upper) {\n      float losa = 1.0 - smoothstep(0.32 - aa.y, 0.32 + aa.y, fv);\n      color = mix(color, vec3(0.1, 0.42, 0.32), losa * step(0.5, fl) * detail);\n      float letrero = (step(2.45, v) - step(3.05, v));\n      color = mix(color, vec3(0.97, 0.97, 0.95), letrero * detail);\n      color = mix(color, vec3(0.1, 0.42, 0.32), (1.0 - smoothstep(0.55 - aa.y, 0.55 + aa.y, v)) * detail);\n    }\n    bool templo = facade > 12.5 && facade < 13.5;\n    if (templo && !upper && len >= 4.0) {\n      float paso = len / max(1.0, floor(len / 4.0));\n      float cx = mod(u, paso) - paso * 0.5;\n      float arco = length(vec2(cx, (v - 5.4) * 1.0));\n      float ventana = step(abs(cx), 0.5) * step(2.4, v) * step(v, 5.4) + step(arco, 0.5) * step(5.4, v);\n      vec3 vitral = mix(vec3(0.24, 0.3, 0.42), vec3(0.95, 0.78, 0.45), u_night * 0.8);\n      color = mix(color, vitral, clamp(ventana, 0.0, 1.0) * detail);\n      emissive += clamp(ventana, 0.0, 1.0) * detail * u_night * 0.6;\n    }\n    if (!templo && !curtain && !upper && len >= 1.5 && v < eave - 0.15) {\n      vec2 q = vec2(cu - cw * 0.5, fv);\n      if (fl < 0.5 && shop && cw > 2.3 && r < 0.6) {\n        // Tienda: persiana metálica y letrero de color encima.\n        float w = min(cw - 0.5, 2.6) * 0.5;\n        float m = rect(q, vec2(-w, 0.0), vec2(w, 2.3), aa);\n        vec3 shutter = vec3(0.58, 0.6, 0.63) * (0.86 + 0.14 * lines(fv, 0.09, 0.022, aa.y));\n        float open = step(0.45, hash1(vec2(ci, seed * 5.0)));\n        shutter = mix(shutter, vec3(0.18, 0.16, 0.14) + vec3(0.9, 0.75, 0.45) * 0.5 * u_night, open * step(fv, 2.1));\n        color = mix(color, shutter, m * detail);\n        float sign = rect(q, vec2(-w, 2.36), vec2(w, 2.68), aa);\n        vec3 sc = u_sign[int(mod(floor(seed * 13.0 + ci), 6.0))];\n        color = mix(color, sc, sign * detail);\n        emissive += sign * detail * 0.6 + m * open * detail * 0.7;\n        gloss = max(gloss, 0.3 * m);\n      } else if (fl < 0.5 && r < 0.42) {\n        float frame = rect(q, vec2(-0.56, 0.0), vec2(0.56, 2.22), aa);\n        float door = rect(q, vec2(-0.46, 0.0), vec2(0.46, 2.13), aa);\n        color = mix(color, vec3(0.88, 0.86, 0.82), frame * detail);\n        vec3 wood = mix(vec3(0.34, 0.21, 0.13), vec3(0.18, 0.32, 0.42), step(0.75, r));\n        color = mix(color, wood * (0.9 + 0.1 * lines(q.x, 0.3, 0.012, aa.x)), door * detail);\n      } else {\n        float w = min(cw * 0.27, fl < 0.5 ? 0.62 : 0.74);\n        float frame = rect(q, vec2(-w - 0.07, 0.83), vec2(w + 0.07, 2.27), aa);\n        float pane = rect(q, vec2(-w, 0.9), vec2(w, 2.2), aa);\n        float sill = rect(q, vec2(-w - 0.12, 0.78), vec2(w + 0.12, 0.88), aa);\n        vec3 frameColor = mod(floor(seed * 7.0), 2.0) < 0.5 ? vec3(0.76, 0.77, 0.78) : vec3(0.22, 0.2, 0.18);\n        color = mix(color, frameColor, frame * detail);\n        float gg;\n        vec3 g = glass(n, v_pos, r, litW, gg);\n        float mullion = max(lines(q.x, w * 2.0, 0.025, aa.x), lines(fv - 1.55, 10.0, 0.025, aa.y));\n        g = mix(g, frameColor, mullion * fine);\n        if (fl < 0.5) g = mix(g, vec3(0.1), lines(q.x, 0.13, 0.012, aa.x) * fine);\n        // Cortina corrida en algunas ventanas.\n        g = mix(g, mix(vec3(0.85, 0.8, 0.7), vec3(0.95, 0.75, 0.45), u_night), step(0.7, r) * 0.7);\n        color = mix(color, g, pane * detail);\n        gloss = max(gloss, gg * pane * detail);\n        emissive += pane * detail * litW * u_night;\n        color = mix(color, vec3(0.86, 0.84, 0.8), sill * detail);\n      }\n    }\n    // Medidor de luz con su acometida y caja de agua en la fachada principal.\n    if (front && meter && !upper && len > 2.0) {\n      float mx = 0.35 + seed * 0.4;\n      vec2 mq = vec2(u - mx, v);\n      float box = rect(mq, vec2(0.0, 1.35), vec2(0.32, 1.78), aa);\n      float dial = rect(mq, vec2(0.06, 1.55), vec2(0.26, 1.7), aa);\n      float cable = rect(mq, vec2(0.14, 1.78), vec2(0.18, min(eave, 3.2)), aa);\n      color = mix(color, vec3(0.62, 0.64, 0.66), box * fine);\n      color = mix(color, vec3(0.12, 0.13, 0.14), (dial + cable) * fine);\n      float water = rect(vec2(u - mx - 0.6, v), vec2(0.0, 0.0), vec2(0.3, 0.22), aa) * step(0.3, seed);\n      color = mix(color, vec3(0.13, 0.2, 0.32), water * fine);\n    }\n    // De lejos las ventanas no se distinguen: de noche queda su brillo promedio.\n    if (!upper && v < eave - 0.15 && len >= 1.5)\n      emissive += (1.0 - detail) * 0.22 * u_night * step(0.9, mod(v, fh));\n    // Oclusión ambiental: pie del muro y esquinas.\n    ao *= mix(0.62, 1.0, smoothstep(0.0, 2.0, v));\n    ao *= mix(0.82, 1.0, smoothstep(0.0, 0.5, min(u, len - u)));\n  }\n\n#if defined(PICK)\n  float id = v_id + 1.0;\n  fragColor = vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), 255.0) / 255.0;\n#else\n  vec3 col = lit(color, n, v_pos, ao, gloss);\n  col += mix(color, vec3(1.0, 0.82, 0.52), 0.55) * emissive * (0.95 * u_night + 0.08);\n  if (abs(v_id - u_selected) < 0.5) col = mix(col, u_selection, 0.5);\n  fragColor = vec4(finish(col, v_pos), 1.0);\n#endif\n}", Le = "\nlayout(location = 0) in vec3 a_pos;\nlayout(location = 1) in vec3 a_normal;\nlayout(location = 2) in vec4 a_color;\nlayout(location = 6) in vec4 i_a;\nlayout(location = 7) in vec2 i_b;\nuniform mat4 u_matrix;\nuniform float u_rise;\nuniform float u_time;\nout vec3 v_pos;\nout vec3 v_normal;\nout vec3 v_color;\nflat out float v_flag;\nflat out float v_paint;\nvoid main() {\n  float c = cos(i_b.x);\n  float s = sin(i_b.x);\n  vec3 ap = a_pos;\n  float part = a_color.a;\n  if (part > 6.5 && part < 10.5) {\n    // 7 y 8 piernas, 9 y 10 brazos: giran en la cadera o el hombro mientras la persona camina.\n    float walking = step(8.0, i_b.y);\n    float phase = u_time * 7.2 + fract(sin(dot(i_a.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;\n    float side = (part < 7.5 || part > 9.5) ? 1.0 : -1.0;\n    float swing = sin(phase) * (part < 8.5 ? 0.42 : 0.3) * side * walking;\n    float pivot = part < 8.5 ? 0.86 : 1.36;\n    vec2 r = vec2(ap.x, ap.z - pivot);\n    ap.x = cos(swing) * r.x + sin(swing) * r.y;\n    ap.z = -sin(swing) * r.x + cos(swing) * r.y + pivot;\n  }\n  vec3 p = ap * i_a.w;\n  p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z * clamp(u_rise / 0.8, 0.0, 1.0));\n  p += i_a.xyz;\n  v_pos = p;\n  v_normal = vec3(c * a_normal.x - s * a_normal.y, s * a_normal.x + c * a_normal.y, a_normal.z);\n  v_color = a_color.rgb;\n  v_flag = a_color.a;\n  v_paint = mod(i_b.y, 8.0);\n  gl_Position = u_matrix * vec4(p, 1.0);\n}", Re = "\nin vec3 v_pos;\nin vec3 v_normal;\nin vec3 v_color;\nflat in float v_flag;\nflat in float v_paint;\nuniform vec3 u_palette[8];\nout vec4 fragColor;\nvoid main() {\n  vec3 n = normalize(v_normal);\n  vec3 color = v_color;\n  float gloss = 0.15;\n  float emissive = 0.0;\n  int flag = int(v_flag + 0.5);\n  if (flag == 1) { color = u_palette[int(v_paint)]; gloss = 0.7; }\n  else if (flag == 4) color = u_palette[int(mod(v_paint + 3.0, 8.0))] * 0.9;\n  else if (flag == 3) { color = vec3(0.2, 0.27, 0.33); gloss = 1.4; }\n  else if (flag == 2) { emissive = 0.3 + 2.2 * u_night; }\n  else if (flag == 5) { emissive = 0.2 + 1.4 * u_night; }\n  vec3 col = lit(color, n, v_pos, 1.0, gloss * (1.0 - u_night));\n  col += color * emissive;\n  fragColor = vec4(finish(col, v_pos), 1.0);\n}", ze = "\nlayout(location = 0) in vec3 a_pos;\nlayout(location = 1) in vec3 a_normal;\nlayout(location = 2) in vec4 a_color;\nlayout(location = 6) in vec4 i_a;\nlayout(location = 7) in vec2 i_b;\nuniform mat4 u_matrix;\nuniform float u_palm;\nuniform float u_time;\nuniform float u_rise;\nout vec3 v_pos;\nout vec3 v_normal;\nout vec3 v_local;\nflat out float v_part;\nflat out float v_seed;\nflat out float v_kind;\nvoid main() {\n  float h = i_a.z;\n  float r = clamp(i_a.w, 1.2, 7.5);\n  float seed = i_b.x;\n  float part = a_color.a;\n  vec3 p;\n  vec3 n = a_normal;\n  if (u_palm < 0.5) {\n    float trunkH = h * 0.42;\n    if (part < 0.5) {\n      float tr = clamp(h * 0.03, 0.14, 0.5);\n      p = vec3(a_pos.xy * tr * (1.15 - 0.3 * a_pos.z), a_pos.z * (trunkH + r * 0.35));\n    } else {\n      float cz = max((h - trunkH) * 0.55, r * 0.6);\n      vec3 q = a_pos;\n      float bump = 0.14 * sin(dot(q, vec3(4.1, 3.3, 5.2)) + seed * 40.0)\n                 + 0.09 * sin(dot(q, vec3(-7.3, 6.1, 2.9)) + seed * 17.0);\n      q *= 1.0 + bump;\n      p = vec3(q.xy * r, q.z * cz + h - cz);\n      n = normalize(vec3(a_normal.xy / r, a_normal.z / cz) + 0.0001);\n    }\n  } else {\n    float trunkH = h * 0.88;\n    float lean = (seed - 0.5) * 0.12;\n    if (part < 0.5) {\n      p = vec3(a_pos.xy * 0.18 * (1.2 - 0.4 * a_pos.z), a_pos.z * trunkH);\n      p.x += lean * p.z;\n    } else {\n      p = vec3(a_pos.xy * r * 1.2, a_pos.z * r + trunkH);\n      p.x += lean * trunkH;\n    }\n  }\n  // Viento: la copa se mece un poco, más arriba que abajo.\n  float sway = sin(u_time * 1.4 + seed * 20.0) * 0.012 * p.z * step(0.5, part);\n  p.x += sway;\n  p.y += sway * 0.6;\n  float g = clamp((u_rise - seed * 0.4) / 0.6, 0.0, 1.0);\n  g = 1.0 - pow(1.0 - g, 3.0);\n  p *= vec3(mix(0.4, 1.0, g), mix(0.4, 1.0, g), g);\n  float ang = seed * 6.2831;\n  float c = cos(ang);\n  float s = sin(ang);\n  v_local = a_pos;\n  p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z) + vec3(i_a.xy, 0.0);\n  v_normal = vec3(c * n.x - s * n.y, s * n.x + c * n.y, n.z);\n  v_pos = p;\n  v_part = part;\n  v_seed = seed;\n  v_kind = i_b.y;\n  gl_Position = u_matrix * vec4(p, 1.0);\n}", Be = "\nin vec3 v_pos;\nin vec3 v_normal;\nin vec3 v_local;\nflat in float v_part;\nflat in float v_seed;\nflat in float v_kind;\nuniform float u_palm;\nout vec4 fragColor;\nvoid main() {\n  vec3 n = normalize(v_normal);\n  vec3 color;\n  float ao = 1.0;\n  if (v_part < 0.5) {\n    color = u_palm > 0.5 ? vec3(0.52, 0.46, 0.38) : vec3(0.36, 0.27, 0.2);\n    color *= 0.9 + 0.1 * sin(v_pos.z * 9.0);\n  } else if (v_part > 1.5) {\n    color = mix(vec3(0.3, 0.5, 0.2), vec3(0.45, 0.6, 0.25), v_seed);\n    if (!gl_FrontFacing) n = -n;\n    n = normalize(vec3(n.xy, abs(n.z) + 0.3));\n  } else {\n    // Copa: verdes variados y algunos árboles en flor (flamboyán, tahuarí, tulipán).\n    // Bagua (bosque seco del Marañón): mango y ficus de verde oscuro y denso, algarrobo y\n    // faique de verde oliva, y copas más secas y amarillentas.\n    vec3 g1 = vec3(0.18, 0.33, 0.14);\n    vec3 g2 = vec3(0.3, 0.44, 0.18);\n    vec3 g3 = vec3(0.4, 0.45, 0.23);\n    vec3 g4 = vec3(0.5, 0.51, 0.27);\n    float k = fract(v_seed * 7.13);\n    color = k < 0.25 ? g1 : k < 0.5 ? g2 : k < 0.75 ? g3 : g4;\n    if (v_kind > 0.5) {\n      float f = fract(v_seed * 13.7);\n      vec3 bloom = f < 0.45 ? vec3(0.86, 0.26, 0.16) : f < 0.75 ? vec3(0.95, 0.74, 0.18) : vec3(0.82, 0.42, 0.72);\n      color = mix(color, bloom, 0.75);\n    }\n    float clump = hash1(floor(v_local.xy * 3.0 + v_local.z * 2.0) + v_seed * 11.0);\n    color *= 0.82 + 0.3 * clump;\n    ao = mix(0.5, 1.05, smoothstep(-0.7, 0.8, v_local.z));\n  }\n  vec3 col = lit(color, n, v_pos, ao, 0.0);\n  fragColor = vec4(finish(col, v_pos), 1.0);\n}", Ve = "\nlayout(location = 0) in vec3 a_pos;\nuniform mat4 u_matrix;\nuniform vec3 u_ground;\nout vec3 v_pos;\nvoid main() {\n  v_pos = vec3(u_ground.xy + a_pos.xy * u_ground.z, 0.06);\n  gl_Position = u_matrix * vec4(v_pos, 1.0);\n}", He = "\nin vec3 v_pos;\nuniform float u_strength;\nout vec4 fragColor;\nvoid main() {\n  float s = shadowAt(v_pos, vec3(0.0, 0.0, 1.0));\n  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));\n  float a = (1.0 - s) * u_strength * (1.0 - fog);\n  fragColor = vec4(vec3(0.02, 0.04, 0.12) * a, a);\n}", Ue = "\nlayout(location = 0) in vec3 a_pos;\nlayout(location = 6) in vec4 i_a;\nlayout(location = 7) in vec2 i_b;\nuniform mat4 u_matrix;\nuniform vec4 u_blob;\nout vec2 v_local;\nout vec3 v_pos;\nvoid main() {\n  float c = cos(i_b.x);\n  float s = sin(i_b.x);\n  vec2 q = a_pos.xy * u_blob.xy + u_blob.zw;\n  v_local = a_pos.xy;\n  v_pos = vec3(i_a.xy + vec2(c * q.x - s * q.y, s * q.x + c * q.y), i_a.z + 0.12);\n  gl_Position = u_matrix * vec4(v_pos, 1.0);\n}", We = "\nin vec2 v_local;\nin vec3 v_pos;\nuniform float u_dark;\nout vec4 fragColor;\nvoid main() {\n  float d = length(v_local);\n  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));\n  if (u_dark > 0.5) {\n    float a = pow(max(0.0, 1.0 - d), 1.5) * 0.5 * (1.0 - 0.5 * u_night) * (1.0 - fog);\n    fragColor = vec4(0.0, 0.0, 0.0, a);\n    return;\n  }\n  float f = pow(max(0.0, 1.0 - d), 2.0) * u_night;\n  fragColor = vec4(vec3(1.0, 0.78, 0.45) * f * 0.55 * (1.0 - fog), 0.0);\n}", Ge = "\nlayout(location = 0) in vec3 a_pos;\nlayout(location = 1) in vec3 a_normal;\nlayout(location = 2) in vec4 a_surf;\nuniform mat4 u_matrix;\nout vec3 v_pos;\nout vec3 v_normal;\nout vec3 v_q;\nflat out float v_kind;\nvoid main() {\n  v_pos = a_pos;\n  v_normal = a_normal;\n  v_q = a_surf.yzw;\n  v_kind = a_surf.x;\n  gl_Position = u_matrix * vec4(a_pos, 1.0);\n}", Ke = "\nin vec3 v_pos;\nin vec3 v_normal;\nin vec3 v_q;\nflat in float v_kind;\nuniform float u_time;\nout vec4 fragColor;\n\nfloat vnoise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), f.x),\n             mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), f.x), f.y);\n}\nfloat mark(float d, float lw, float px) { return 1.0 - smoothstep(lw, lw + px, abs(d)); }\n\nvoid main() {\n  vec3 n = normalize(v_normal);\n  vec2 w = v_pos.xy;\n  float px = max(length(fwidth(w)), 1e-4);\n  float fine = 1.0 - smoothstep(0.04, 0.2, px);\n  float detail = 1.0 - smoothstep(0.25, 2.0, px);\n  int k = int(v_kind + 0.5);\n  float u = v_q.x;\n  float v = v_q.y;\n  float q = v_q.z;\n  vec3 color = vec3(0.6);\n  float gloss = 0.0;\n  float emissive = 0.0;\n  float alpha = 1.0;\n\n  if (k >= 100) {\n    // Objetos (bancas, monumento, señales, puestos, buses, barandas) con su color.\n    color = v_q;\n    int flag = k - 100;\n    if (flag == 2) emissive = 0.3 + 2.2 * u_night;\n    else if (flag == 5) emissive = 0.2 + 1.4 * u_night;\n    else if (flag == 3) gloss = 1.4;\n    else if (flag == 6) gloss = 0.9;\n  } else if (k == 0) {\n    // Lotes y patios: tierra, césped, patios de cemento y vegetación seca según el sector.\n    float zone = u;\n    float n1 = vnoise(w / 16.0);\n    float n2 = vnoise(w / 3.5 + 7.3);\n    float n3 = vnoise(w / 55.0 + 3.1);\n    vec3 soil = mix(vec3(0.72, 0.57, 0.4), vec3(0.63, 0.43, 0.29), n3);\n    soil *= 0.9 + 0.16 * n2 * detail;\n    float patio = (1.0 - smoothstep(0.1, 0.45, zone)) * smoothstep(0.42, 0.58, n1);\n    float green = smoothstep(0.52, 0.7, n1 * 0.75 + n2 * 0.25 + 0.08 - zone * 0.18) * (1.0 - 0.45 * zone);\n    float dry = smoothstep(0.45, 0.7, n3 * 0.6 + n2 * 0.4) * smoothstep(0.35, 0.9, zone);\n    color = soil;\n    color = mix(color, vec3(0.7, 0.69, 0.66) * (0.94 + 0.08 * n2), patio * 0.8);\n    color = mix(color, mix(vec3(0.36, 0.5, 0.22), vec3(0.5, 0.6, 0.3), n2), green * 0.88);\n    color = mix(color, mix(vec3(0.62, 0.56, 0.36), vec3(0.5, 0.48, 0.3), n2), dry * 0.75);\n    color *= 1.0 - 0.12 * step(0.94, hash1(floor(w * 4.0))) * fine;\n    alpha = smoothstep(0.25, 0.65, v + (vnoise(w / 7.0) - 0.5) * 0.5);\n  } else if (k == 1 && q > 0.5) {\n    // Pavimento de concreto (calles y avenidas de Bagua): paños de 4,5 m con juntas, junta\n    // longitudinal al centro y huellas de rodadura un poco más oscuras.\n    color = vec3(0.67, 0.66, 0.63) * (0.93 + 0.07 * vnoise(w * 1.3) * detail + 0.05 * vnoise(w / 7.0));\n    float panio = floor(u / 4.5);\n    color *= 0.97 + 0.05 * hash1(vec2(panio, sign(v)));\n    color = mix(color, vec3(0.42, 0.42, 0.41), max(lines(u, 4.5, 0.012, px), 1.0 - smoothstep(0.01, 0.03, abs(v))) * fine * 0.8);\n    color *= 1.0 - 0.07 * (1.0 - smoothstep(0.3, 0.9, abs(abs(v) - 1.6)));\n    color = mix(color, color * 0.85, smoothstep(0.78, 0.84, vnoise(w / 4.0 + 7.0)) * detail);\n    gloss = 0.05;\n  } else if (k == 1) {\n    // Asfalto (carretera): agregado, parches, huellas de rodadura más claras.\n    color = vec3(0.3, 0.31, 0.32) * (0.9 + 0.12 * vnoise(w * 1.7) * detail + 0.08 * vnoise(w / 9.0));\n    color *= 1.0 + 0.14 * (hash1(floor(w * 14.0)) - 0.5) * fine;\n    color = mix(color, color * 0.8, smoothstep(0.74, 0.8, vnoise(w / 5.0 + 13.0)) * detail);\n    color *= 1.0 + 0.06 * (1.0 - smoothstep(0.3, 1.0, abs(abs(v) - 1.7)));\n    gloss = 0.12;\n  } else if (k == 2) {\n    // Calle de tierra o afirmado: huellas, piedras, charcos y hierba en los bordes.\n    color = mix(vec3(0.7, 0.55, 0.39), vec3(0.6, 0.43, 0.3), vnoise(w / 3.0));\n    color *= 0.88 + 0.18 * vnoise(w * 2.3) * detail;\n    float rut = 1.0 - smoothstep(0.15, 0.45, abs(abs(v) - 0.9));\n    color *= 1.0 - 0.13 * rut;\n    color = mix(color, vec3(0.72, 0.7, 0.64), step(0.94, hash1(floor(w * 5.0))) * fine * 0.6);\n    color = mix(color, vec3(0.46, 0.5, 0.29), smoothstep(2.0, 2.9, abs(v)) * vnoise(w / 1.3) * 0.7);\n    float puddle = smoothstep(0.8, 0.84, vnoise(w / 4.0 + 41.0)) * rut;\n    color = mix(color, vec3(0.32, 0.3, 0.26), puddle * 0.75);\n    gloss = puddle * 1.5;\n    float edge = abs(v) + (vnoise(w / 2.2) - 0.5) * 1.1;\n    alpha = 1.0 - smoothstep(q - 0.7, q + 0.45, edge);\n  } else if (k == 3) {\n    // Vereda de concreto con juntas cada 1,5 m y sardinel más claro junto a la pista.\n    color = vec3(0.73, 0.72, 0.68) * (0.93 + 0.08 * vnoise(w * 1.5) * detail);\n    color *= 1.0 - 0.2 * lines(u, 1.5, 0.012, px) * fine;\n    color = mix(color, vec3(0.82, 0.81, 0.77), 1.0 - smoothstep(0.14, 0.16, v - q));\n    color *= 1.0 - 0.1 * smoothstep(0.7, 0.9, vnoise(w / 2.0 + 5.0)) * detail;\n  } else if (k == 4) {\n    // Cara del sardinel: concreto, o pintado de amarillo en el centro.\n    color = q > 0.5 ? vec3(0.9, 0.74, 0.18) : vec3(0.75, 0.74, 0.7);\n    color *= 0.92 + 0.08 * vnoise(vec2(u * 2.0, v * 9.0));\n  } else if (k == 5) {\n    // Césped de jardines y bermas: matas, desgaste y flores en plazas y parques.\n    color = mix(vec3(0.33, 0.5, 0.2), vec3(0.46, 0.6, 0.27), vnoise(w / 2.5));\n    color *= 0.84 + 0.26 * vnoise(w * 4.0) * detail;\n    color = mix(color, vec3(0.56, 0.48, 0.36), smoothstep(0.76, 0.86, vnoise(w / 5.0 + 9.0)) * 0.5);\n    if (q > 0.5) {\n      float f = step(0.965, hash1(floor(w * 3.0))) * fine;\n      color = mix(color, mix(vec3(0.9, 0.3, 0.35), vec3(0.95, 0.8, 0.3), hash1(floor(w * 3.0) + 2.0)), f);\n    }\n  } else if (k == 6 || k == 7) {\n    // Losetas de plaza (6) o camino de cemento (7), con sardinel de jardín en los bordes.\n    vec2 t = (q > 900.0 ? w : vec2(u, v)) / 0.5;\n    if (k == 6) {\n      vec2 g8 = floor(w / 4.0);\n      float marco = max(lines(w.x, 4.0, 0.22, px * 2.0), lines(w.y, 4.0, 0.22, px * 2.0));\n      float grecas = step(0.5, fract((g8.x + g8.y) * 0.5)) * max(lines(w.x + w.y, 2.0, 0.12, px * 2.0),\n                                                                 lines(w.x - w.y, 2.0, 0.12, px * 2.0));\n      color = vec3(0.88, 0.88, 0.86) * (0.96 + 0.04 * vnoise(w * 2.0));\n      color = mix(color, vec3(0.38, 0.4, 0.43), max(marco, grecas * 0.85) * (0.4 + 0.6 * detail));\n      color *= 1.0 - 0.18 * (lines(t.x, 1.0, 0.03, px * 2.0) + lines(t.y, 1.0, 0.03, px * 2.0)) * fine;\n    } else {\n      color = vec3(0.74, 0.73, 0.69) * (0.94 + 0.08 * vnoise(w * 1.3) * detail);\n      color *= 1.0 - 0.18 * lines(u, 2.0, 0.012, px) * fine;\n    }\n    color *= 0.95 + 0.06 * vnoise(w * 0.7);\n    if (q < 900.0) color = mix(color, vec3(0.84, 0.83, 0.79), smoothstep(q - 0.2 - px, q - 0.2 + px, abs(v)));\n  } else if (k == 8 || k == 9) {\n    // Cancha de césped con franjas de corte (8) o losa deportiva pintada (9), con sus líneas.\n    float hw = floor(q / 1000.0);\n    float hl = q - hw * 1000.0;\n    float lx = hl - 1.0;\n    float ly = hw - 1.0;\n    float sc = clamp(ly / 34.0, 0.25, 1.0);\n    float lw = max(0.06, px * 0.45);\n    vec2 a = vec2(abs(u), abs(v));\n    float bx = 16.5 * sc;\n    float by = min(20.16 * sc, ly);\n    float L = mark(a.x - lx, lw, px) * step(a.y, ly + lw)\n            + mark(a.y - ly, lw, px) * step(a.x, lx + lw)\n            + mark(u, lw, px) * step(a.y, ly)\n            + mark(length(vec2(u, v)) - 9.15 * sc, lw, px)\n            + mark(a.x - (lx - bx), lw, px) * step(a.y, by)\n            + mark(a.y - by, lw, px) * step(lx - bx, a.x) * step(a.x, lx);\n    if (k == 8) {\n      color = vec3(0.29, 0.53, 0.21) * (0.92 + 0.1 * step(0.5, fract(u / (5.0 * sc))));\n      color *= 0.92 + 0.12 * vnoise(w * 1.5) * detail;\n      color = mix(color, vec3(0.55, 0.47, 0.34), smoothstep(0.72, 0.86, vnoise(w / 4.0 + 3.0)) * 0.35);\n    } else {\n      float inField = step(a.x, lx) * step(a.y, ly);\n      float hue = hash1(vec2(floor(hl * 10.0), floor(hw * 10.0)));\n      vec3 paint = hue < 0.35 ? vec3(0.27, 0.48, 0.4) : hue < 0.65 ? vec3(0.3, 0.42, 0.58) : vec3(0.62, 0.36, 0.3);\n      color = mix(vec3(0.66, 0.65, 0.62), paint, inField * 0.85);\n      color *= 0.93 + 0.08 * vnoise(w * 1.2) * detail;\n    }\n    color = mix(color, vec3(0.94), clamp(L, 0.0, 1.0) * (0.35 + 0.55 * detail));\n  } else if (k == 10) {\n    // Agua de piscina con carriles y reflejos que se mueven.\n    color = vec3(0.1, 0.5, 0.63) * (0.9 + 0.15 * vnoise(w * 1.6 + vec2(u_time * 0.4, u_time * 0.3)) * detail);\n    color = mix(color, vec3(0.06, 0.25, 0.45), lines(v, 2.5, 0.12, px) * 0.6 * detail);\n    gloss = 2.0;\n  } else if (k == 11) {\n    // Tierra compactada (estadio, cementerio) con matas.\n    color = mix(vec3(0.7, 0.55, 0.39), vec3(0.62, 0.45, 0.32), vnoise(w / 6.0));\n    color *= 0.88 + 0.16 * vnoise(w * 2.0) * detail;\n    color = mix(color, vec3(0.5, 0.53, 0.32), smoothstep(0.7, 0.85, vnoise(w / 3.0 + 4.0)) * 0.5);\n  } else if (k == 12) {\n    // Losa de concreto (patios, andenes) con juntas y manchas; borde claro de piscina.\n    color = vec3(0.7, 0.69, 0.66) * (0.93 + 0.08 * vnoise(w * 1.1) * detail);\n    color *= 1.0 - 0.16 * (lines(w.x, 3.0, 0.015, px) + lines(w.y, 3.0, 0.015, px)) * fine;\n    color = mix(color, color * 0.75, smoothstep(0.78, 0.84, vnoise(w / 3.0 + 21.0)) * 0.6 * (1.0 - q));\n    if (q > 0.5) color = vec3(0.86, 0.86, 0.83) * (0.95 + 0.05 * vnoise(w * 2.0));\n  } else if (k == 14) {\n    // Paso de cebra: franjas de 0,5 m.\n    if (lines(v, 1.0, 0.25, px) * (0.4 + 0.6 * detail) < 0.5) discard;\n    color = vec3(0.9, 0.9, 0.86) * (0.88 + 0.12 * vnoise(w * 3.0));\n  } else if (k == 17 || k == 18) {\n    // Río: agua turbia que corre a lo largo del cauce, con brillo de cielo y sol. En el cauce\n    // dibujado desde el eje (18), orillas de grava irregulares que se funden con el suelo.\n    vec2 dir = normalize(vec2(u, v) + 1e-5);\n    vec2 f = vec2(dot(w, dir), dot(w, vec2(-dir.y, dir.x)));\n    float shore = 0.0;\n    if (k == 18) {\n      dir = vec2(1.0, 0.0);\n      f = vec2(u, v);\n      float edge = abs(v) + (vnoise(vec2(u * 0.035, v > 0.0 ? 1.0 : 7.0)) - 0.5) * 9.0;\n      shore = smoothstep(q - 8.5, q - 6.0, edge);\n      alpha = 1.0 - smoothstep(q - 3.0, q, edge);\n    }\n    float t = u_time;\n    float n1 = vnoise(vec2(f.x * 0.05 - t * 0.22, f.y * 0.16));\n    float n2 = vnoise(vec2(f.x * 0.4 - t * 1.1, f.y * 0.9) + 17.0);\n    float n3 = vnoise(vec2(f.x * 1.3 - t * 1.6, f.y * 2.1) + 5.0);\n    // Más hondo y verdoso al centro del cauce, más claro y terroso hacia la orilla.\n    float deep = k == 18 ? 1.0 - smoothstep(2.0, q - 7.0, abs(v)) : 0.7;\n    color = mix(vec3(0.58, 0.48, 0.35), vec3(0.4, 0.35, 0.25), deep);\n    color *= 0.9 + 0.2 * n1;\n    vec2 g = vec2(n2 - 0.5, n3 - 0.5) * (0.25 + 0.2 * detail);\n    n = normalize(vec3(g.x * dir + g.y * vec2(-dir.y, dir.x), 1.0));\n    vec3 view = normalize(u_eye - v_pos);\n    float fres = pow(1.0 - max(dot(n, view), 0.0), 3.0);\n    color = mix(color, mix(vec3(0.6, 0.72, 0.84), vec3(0.1, 0.13, 0.22), u_night), 0.12 + fres * 0.45);\n    color += vec3(0.05) * smoothstep(0.62, 0.9, n2 * n3 * 1.8) * detail * (1.0 - u_night);\n    gloss = 2.6 * (1.0 - shore);\n    if (shore > 0.0) {\n      vec3 gravel = mix(vec3(0.66, 0.6, 0.5), vec3(0.55, 0.47, 0.38), vnoise(w * 0.7));\n      gravel *= 0.85 + 0.25 * hash1(floor(w * 6.0)) * fine + 0.1 * vnoise(w * 3.0) * detail;\n      gravel = mix(gravel, vec3(0.45, 0.5, 0.3), smoothstep(0.6, 0.85, vnoise(w / 3.0 + 9.0)) * 0.6);\n      color = mix(color, gravel, shore);\n      n = normalize(mix(n, vec3(0.0, 0.0, 1.0), shore));\n    }\n  } else if (k == 15) {\n    // Línea central amarilla discontinua (3 m pintado, 3 m libre).\n    if (fract(u / 6.0) < 0.5) discard;\n    color = vec3(0.88, 0.72, 0.2);\n  }\n  vec3 col = lit(color, n, v_pos, 1.0, gloss * (1.0 - u_night));\n  col += color * emissive;\n  col = finish(col, v_pos);\n  fragColor = vec4(col * alpha, alpha);\n}", qe = "\nlayout(location = 0) in vec3 a_pos;\nuniform mat4 u_matrix;\nout float v_a;\nout vec3 v_pos;\nvoid main() {\n  v_a = a_pos.z;\n  v_pos = vec3(a_pos.xy, 0.1);\n  gl_Position = u_matrix * vec4(v_pos, 1.0);\n}", Je = "\nin float v_a;\nin vec3 v_pos;\nout vec4 fragColor;\nvoid main() {\n  float fog = smoothstep(u_fog.x, u_fog.y, distance(u_eye, v_pos));\n  float a = v_a * v_a * 0.4 * (1.0 - fog) * (1.0 - 0.45 * u_night);\n  fragColor = vec4(0.0, 0.0, 0.0, a);\n}", Ye = "\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1.0); }";
function Xe(e, t) {
	let n = {
		building: Fe,
		mesh: Le,
		tree: ze,
		ground: Ve,
		glow: Ue,
		surface: Ge,
		skirt: qe
	}[e], r = {
		building: Ie,
		mesh: Re,
		tree: Be,
		ground: He,
		glow: We,
		surface: Ke,
		skirt: Je
	}[e], i = t === "pick" ? "#define PICK\n" : "";
	return {
		vertex: Ne + i + n,
		fragment: Ne + i + (t === "shadow" ? Ye : Pe + r)
	};
}
// src/mapa/ciudad/traffic.ts
var Ze = [
	"mototaxi",
	"moto",
	"auto"
], Qe = {
	mototaxi: {
		count: 70,
		speed: [5.2, 7],
		lane: 1.5,
		colors: [
			0,
			1,
			2,
			3,
			0,
			1,
			7
		]
	},
	moto: {
		count: 45,
		speed: [7.5, 10],
		lane: 1.1,
		colors: [
			0,
			1,
			6,
			6,
			5,
			7,
			2
		]
	},
	auto: {
		count: 14,
		speed: [8, 11],
		lane: 1.8,
		colors: [
			4,
			4,
			5,
			6,
			0,
			5
		]
	}
}, $e = class {
	g;
	cum;
	length;
	vehicles = [];
	random = Math.random;
	buffers;
	constructor(e) {
		this.g = e;
		let t = e.edgeStart.length;
		this.cum = new Float32Array(e.points.length / 2), this.length = new Float32Array(t);
		let n = [];
		for (let r = 0; r < t; r++) {
			let t = e.edgeStart[r], i = 0;
			this.cum[t] = 0;
			for (let n = 1; n < e.edgeCount[r]; n++) {
				let r = t + n;
				i += Math.hypot(e.points[r * 2] - e.points[r * 2 - 2], e.points[r * 2 + 1] - e.points[r * 2 - 1]), this.cum[r] = i;
			}
			this.length[r] = i;
			let a = t + Math.floor(e.edgeCount[r] / 2);
			n.push(e.points[a * 2], e.points[a * 2 + 1]);
		}
		let r = Array.from({ length: t }, (t, r) => {
			let i = Math.hypot(n[r * 2], n[r * 2 + 1]);
			return this.length[r] * Math.exp(-i / 1400) * (e.edgeCode[r] >= 2 ? 2.5 : 1);
		}), i = r.reduce((e, t) => e + t, 0), a = () => {
			let e = this.random() * i;
			for (let n = 0; n < t; n++) if ((e -= r[n]) <= 0) return n;
			return 0;
		};
		Ze.forEach((e, n) => {
			let r = Qe[e];
			for (let e = 0; e < r.count && t; e++) {
				let e = a();
				this.vehicles.push({
					type: n,
					edge: e,
					dir: this.random() < .5 ? 1 : -1,
					s: this.random() * this.length[e],
					speed: r.speed[0] + this.random() * (r.speed[1] - r.speed[0]),
					color: r.colors[Math.floor(this.random() * r.colors.length)],
					heading: 0,
					stop: 0,
					x: 0,
					y: 0
				});
			}
		}), this.buffers = Ze.map((e) => new Float32Array(Qe[e].count * 6)), this.update(0);
	}
	next(e) {
		let t = this.g, n = e.dir > 0 ? t.edgeB[e.edge] : t.edgeA[e.edge], r = t.adjStart[n], i = t.adjStart[n + 1], a = [], o = 0;
		for (let n = r; n < i; n++) {
			let s = t.adj[n];
			s === e.edge && i - r > 1 || (a.push(s), o += t.edgeCode[s] >= 2 ? 2 : 1);
		}
		let s = this.random() * o, c = a[0] ?? e.edge;
		for (let e of a) if ((s -= t.edgeCode[e] >= 2 ? 2 : 1) <= 0) {
			c = e;
			break;
		}
		e.dir = t.edgeA[c] === n ? 1 : -1, e.edge = c;
	}
	update(e) {
		let t = this.g, n = [
			0,
			0,
			0
		];
		for (let r of this.vehicles) {
			r.type === 0 && (r.stop > 0 ? r.stop -= e : this.random() < e * .02 && (r.stop = 2 + this.random() * 4)), r.stop <= 0 && (r.s += r.speed * e * (t.edgeCode[r.edge] >= 2 ? 1.15 : 1));
			let i = 0;
			for (; r.s > this.length[r.edge] && i++ < 8;) r.s -= this.length[r.edge], this.next(r);
			let a = this.length[r.edge], o = r.dir > 0 ? r.s : a - r.s, s = t.edgeStart[r.edge], c = t.edgeCount[r.edge], l = 1;
			for (; l < c - 1 && this.cum[s + l] < o;) l++;
			let u = s + l - 1, d = s + l, f = this.cum[d] - this.cum[u] || 1, p = Math.min(1, Math.max(0, (o - this.cum[u]) / f)), m = t.points[u * 2], h = t.points[u * 2 + 1], g = t.points[d * 2], _ = t.points[d * 2 + 1], v = (g - m) * r.dir, y = (_ - h) * r.dir, b = Math.hypot(v, y) || 1;
			v /= b, y /= b;
			let x = Qe[Ze[r.type]].lane;
			r.x = m + (g - m) * p + y * x, r.y = h + (_ - h) * p - v * x;
			let S = Math.atan2(y, v), C = S - r.heading;
			for (; C > Math.PI;) C -= Math.PI * 2;
			for (; C < -Math.PI;) C += Math.PI * 2;
			r.heading = e === 0 ? S : r.heading + C * Math.min(1, e * 7);
			let w = this.buffers[r.type], T = n[r.type] * 6;
			n[r.type]++, w[T] = r.x, w[T + 1] = r.y, w[T + 2] = .04, w[T + 3] = 1, w[T + 4] = r.heading, w[T + 5] = r.color;
		}
	}
}, et = "(function(){let e=/* @__PURE__ */ new Set,t=!1;function n(t,n,i=2){let o=n&&n.length,s=o?n[0]*i:t.length;e.size&&e.clear();let c=r(t,0,s,i,!0),l=[];if(!c||c.next===c.prev)return l;let u=0,f=0,p=0;if(o&&(c=d(t,n,c,i)),t.length>80*i){u=t[0],f=t[1];let e=u,n=f;for(let r=i;r<s;r+=i){let i=t[r],a=t[r+1];i<u&&(u=i),a<f&&(f=a),i>e&&(e=i),a>n&&(n=a)}p=Math.max(e-u,n-f),p=p===0?0:32767/p}return a(c,l,u,f,p),l}function r(e,t,n,r,i){let a=null;if(i===ae(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=ie(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=ie(i/r|0,e[i],e[i+1],a);return a&&I(a,a.next)&&(V(a),a=a.next),a}function i(n,r=n){let i=r===n,a=n,o;do o=!1,a!==a.next&&(e.size===0||!e.has(a))&&(I(a,a.next)||F(a.prev,a,a.next)===0)?((i||a===r)&&(r=a.prev),t=!0,V(a),a=a.prev,o=!0):(i||a!==r)&&(a=a.next,o=!i);while(o||a!==r);return r}function a(e,n,r,a,u){u&&A(e,r,a,u);let d=e,f=!1;for(;e.prev!==e.next;){let p=e.prev,m=e.next;if(F(p,e,m)<0&&(u?s(e,r,a,u):o(e)))n.push(p.i,e.i,m.i),V(e),e=m,d=m;else if(e=m,e===d){if(t=!1,e=i(e),t){d=e;continue}if(!f){e=c(e,n),d=e,f=!0;continue}l(e,n,r,a,u);break}}}function o(e){let t=e.prev,n=e,r=e.next,i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&(i!==m.x||s!==m.y)&&ee(i,s,a,c,o,l,m.x,m.y)&&F(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function s(e,t,n,r){let i=e.prev,a=e,o=e.next,s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=N(p,m,t,n,r),v=N(h,g,t,n,r),y=e.prevZ;for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==o&&(s!==y.x||u!==y.y)&&ee(s,u,c,d,l,f,y.x,y.y)&&F(y.prev,y,y.next)>=0)return!1;y=y.prevZ}let b=e.nextZ;for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==o&&(s!==b.x||u!==b.y)&&ee(s,u,c,d,l,f,b.x,b.y)&&F(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function c(e,t){let n=e,r=!1;do{let i=n.prev,a=n.next.next;L(i,n,n.next,a,!1)&&z(i,a)&&z(a,i)&&(t.push(i.i,n.i,a.i),V(n),V(n.next),n=e=a,r=!0),n=n.next}while(n!==e);return r?i(n):n}function l(e,t,n,r,o){let s=e;do{let e=s.next.next;for(;e!==s.prev;){if(s.i!==e.i&&te(s,e)){let c=re(s,e);s=i(s,s.next),c=i(c,c.next),a(s,t,n,r,o),a(c,t,n,r,o);return}e=e.next}s=s.next}while(s!==e)}let u=!1;function d(t,n,a,o){let s=[];for(let i=0,a=n.length;i<a;i++){let c=r(t,n[i]*o,i<a-1?n[i+1]*o:t.length,o,!1);c===c.next&&e.add(c),s.push(P(c))}s.sort(f),v(t.length/o,n.length),y(a,a),u=!0;for(let e=0;e<s.length;e++)a=p(s[e],a);return u=!1,i(a)}function f(e,t){return e.x-t.x||e.y-t.y||(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x)}function p(e,t){let n=C(e,t);if(!n)return t;let r=re(n,e),a=r.next;return y(n,a.next),i(r,r.next),i(n,n.next)}let m=/* @__PURE__ */ new Float64Array,h=0,g=[],_=[];function v(e,t){let n=Math.ceil((e+2*t)/16)+t+2;m.length<n*4&&(m=new Float64Array(n*4)),h=0}function y(e,t){let n=e;do{let e=h++;g[e]=n;let r=n.x,i=n.y,a=n.x,o=n.y,s=0;do{let t=n.next;n.z=e,t.x<r&&(r=t.x),t.x>a&&(a=t.x),t.y<i&&(i=t.y),t.y>o&&(o=t.y),n=t}while(++s<16&&n!==t);_[e]=n;let c=e*4;m[c]=r,m[c+1]=i,m[c+2]=a,m[c+3]=o}while(n!==t)}function b(e,t){let n=e.z*4;t.x<m[n]&&(m[n]=t.x),t.y<m[n+1]&&(m[n+1]=t.y),t.x>m[n+2]&&(m[n+2]=t.x),t.y>m[n+3]&&(m[n+3]=t.y)}function x(e){let t=_[e];for(;t.prev.next!==t;)t=t.next;return _[e]=t,t}function S(e){let t=g[e];for(;t.prev.next!==t;)t=t.next;return g[e]=t,t}function C(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(I(e,n))return n;for(let t=0,s=0;t<h;t++,s+=4){if(i<m[s+1]||i>m[s+3]||m[s]>r||m[s+2]<=a)continue;let c=x(t);n=S(t);do{if(n.prev.next===n){if(I(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}}n=n.next}while(n!==c)}if(!o)return null;let s=o.x,c=o.y,l=Math.min(i,c),u=Math.max(i,c),d=1/0;for(let t=0,f=0;t<h;t++,f+=4){if(m[f+2]<s||m[f]>r||m[f+3]<l||m[f+1]>u)continue;let p=x(t);n=S(t);do{if(n.prev.next===n&&r>=n.x&&n.x>=s&&r!==n.x&&ee(i<c?r:a,i,s,c,i<c?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);(z(n,e)||n.y===i&&n.next.y===i&&n.next.x>r)&&(t<d||t===d&&(n.x>o.x||n.x===o.x&&w(o,n)))&&(o=n,d=t)}n=n.next}while(n!==p)}return o}function w(e,t){return F(e.prev,e,t.prev)<0&&F(t.next,e,e.next)<0}let T=[],E=[],D=/* @__PURE__ */ new Uint32Array,O=/* @__PURE__ */ new Uint32Array,k=/* @__PURE__ */ new Uint32Array(256);function A(e,t,n,r){let i=e,a=0;do i.z=N(i.x,i.y,t,n,r),T[a++]=i,i=i.next;while(i!==e);j(a);let o=null;for(let e=0;e<a;e++){let t=T[e];t.prevZ=o,o&&(o.nextZ=t),o=t}o.nextZ=null,T.fill(null,0,a),E.fill(null,0,a)}function j(e){if(e<=32)for(let t=1;t<e;t++){let e=T[t],n=e.z,r=t-1;for(;r>=0&&T[r].z>n;)T[r+1]=T[r],r--;T[r+1]=e}else{D.length<e&&(D=new Uint32Array(e),O=new Uint32Array(e),E=Array(e));for(let t=0;t<e;t++)D[t]=T[t].z;M(e,T,D,E,O,0),M(e,E,O,T,D,8),M(e,T,D,E,O,16),M(e,E,O,T,D,24)}}function M(e,t,n,r,i,a){k.fill(0);for(let t=0;t<e;t++)k[n[t]>>>a&255]++;let o=0;for(let e=0;e<256;e++){let t=k[e];k[e]=o,o+=t}for(let o=0;o<e;o++){let e=n[o],s=k[e>>>a&255]++;r[s]=t[o],i[s]=e}}function N(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function P(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function ee(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function te(e,t){let n=I(e,t)&&F(e.prev,e,e.next)>0&&F(t.prev,t,t.next)>0;return e.next.i!==t.i&&(n||z(e,t)&&z(t,e)&&(F(e.prev,e,t.prev)!==0||F(e,t.prev,t)!==0))&&!ne(e,t)&&(n||B(e,t))}function F(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function I(e,t){return e.x===t.x&&e.y===t.y}function L(e,t,n,r,i=!0){let a=F(e,t,n),o=F(e,t,r),s=F(n,r,e),c=F(n,r,t);return(a>0&&o<0||a<0&&o>0)&&(s>0&&c<0||s<0&&c>0)?!0:i?!!(a===0&&R(e,n,t)||o===0&&R(e,r,t)||s===0&&R(n,e,r)||c===0&&R(n,t,r)):!1}function R(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function ne(e,t){let n=Math.min(e.x,t.x),r=Math.max(e.x,t.x),i=Math.min(e.y,t.y),a=Math.max(e.y,t.y),o=e;do{let s=o.next;if(o.x>r&&s.x>r||o.x<n&&s.x<n||o.y>a&&s.y>a||o.y<i&&s.y<i)o=s;else{if(o.i!==e.i&&s.i!==e.i&&o.i!==t.i&&s.i!==t.i&&L(o,s,e,t))return!0;o=s}}while(o!==e);return!1}function z(e,t){return F(e.prev,e,e.next)<0?F(e,t,e.next)>=0&&F(e,e.prev,t)>=0:F(e,t,e.prev)<0||F(e,e.next,t)<0}function B(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do{let e=n.next;n.y>a!=e.y>a&&i<(e.x-n.x)*(a-n.y)/(e.y-n.y)+n.x&&(r=!r),n=e}while(n!==e);return r}function re(e,t){let n=H(e.i,e.x,e.y),r=H(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function ie(e,t,n,r){let i=H(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function V(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ),u&&b(e.prev,e.next)}function H(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null}}function ae(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}let oe=/* @__PURE__ */ new Set([3,5]),se=[[0,58],[1,30],[4,30],[6,25],[7,30],[3,51],[5,24],[2,4],[8,4]],ce=(()=>{let e=[],t=se.map(([e,t])=>({roof:e,n:t}));for(;e.length<256;)for(let n of t)n.n>0&&(e.push(n.roof),n.n--);return e.slice(0,256)})();function U(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return t>>>0}let le=e=>{let t=parseInt(e.slice(0,2),16);return Number.isNaN(t)||e.length<2?U(e)%256:t},ue=e=>ce[le(e)],de=e=>{let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]};var fe=class{unit;cells=/* @__PURE__ */ new Map;constructor(e){this.unit=e}add(e,t,n,r,i,a,o){let s=Math.floor((n+i)/2/250)+1e3,c=(Math.floor((r+a)/2/250)+1e3)*4e3+s,l=this.cells.get(c);if(!l)l={box:[n,r,i,a,o],ranges:[],size:0},this.cells.set(c,l);else{let e=l.box;e[0]=Math.min(e[0],n),e[1]=Math.min(e[1],r),e[2]=Math.max(e[2],i),e[3]=Math.max(e[3],a),e[4]=Math.max(e[4],o)}let u=l.ranges;u.length&&u[u.length-1]===e?u[u.length-1]=t:u.push(e,t),l.size+=t-e}finish(e,t,n=0){let r=[...this.cells.keys()].sort((e,t)=>e-t),i=0;for(let e of r)i+=this.cells.get(e).size;let a=t(i),o=new Float32Array(r.length*7),s=0;return r.forEach((t,r)=>{let i=this.cells.get(t);o.set([...i.box,n+s/this.unit,i.size/this.unit],r*7);for(let t=0;t<i.ranges.length;t+=2)a.set(e.subarray(i.ranges[t],i.ranges[t+1]),s),s+=i.ranges[t+1]-i.ranges[t]}),{data:a,table:o}}};function pe(e,t){let n=new fe(t);for(let r=0;r+t<=e.length;r+=t){let i=e[r],a=e[r+1],o=Math.max(1,e[r+3]);n.add(r,r+t,i-o,a-o,i+o,a+o,e[r+2]+o)}return n.finish(e,e=>new Float32Array(e))}function me(e){let t=Math.floor(e/10);return{code:e%10,unpaved:(t&1)>0,green:(t&2)>0,malecon:(t&4)>0}}function he(e){let t=/* @__PURE__ */ new Map;for(let[n,r]of Object.entries(e.suelo?.especiales??{}))for(let e of r)t.set(e,n);let n=(e.suelo?.areas??[]).filter(e=>e[0]===1).map(e=>{let t=[];for(let n=1;n+1<e.length;n+=2)t.push([e[n]/10,e[n+1]/10]);return t});if(!n.length)return t;let r=(e,t)=>{let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r],o=t[i];a[1]>e[1]!=o[1]>e[1]&&e[0]<(o[0]-a[0])*(e[1]-a[1])/(o[1]-a[1])+a[0]&&(n=!n)}return n};return e.edificios.ids.forEach((i,a)=>{let o=e.edificios.geometrias[a]?.[0]?.[0];if(!o||t.has(i))return;let s=[];for(let e=0;e+1<o.length;e+=2)s.push([o[e]/10,o[e+1]/10]);if(s.length<3||Math.abs(K(s))>400)return;let c=q(s);n.some(e=>r(c,e))&&t.set(i,`plaza`)}),t}let W={simulated:1,unfinished:2,shop:4,upper:8,meter:16,earth:32,front:64},ge=2048,G={painted:0,brick:1,wood:2,adobe:3,concrete:4,quincha:5,sheet:6,mat:7},_e=e=>{let t=e||1;return()=>(t^=t<<13,t^=t>>>17,t^=t<<5,(t>>>0)%1e5/1e5)};function K(e){let t=0;return e.forEach((n,r)=>{let i=e[(r+1)%e.length];t+=n[0]*i[1]-i[0]*n[1]}),t/2}function ve(e){let t=0,n=0;e.forEach((r,i)=>{let a=e[(i+1)%e.length],o=Math.hypot(a[0]-r[0],a[1]-r[1]);o>n&&([n,t]=[o,i])});let r=e[t],i=e[(t+1)%e.length],a=n?(i[0]-r[0])/n:1,o=n?(i[1]-r[1])/n:0,[s,c,l,u]=[1/0,-1/0,1/0,-1/0];for(let t of e){let e=t[0]*a+t[1]*o,n=-t[0]*o+t[1]*a;[s,c,l,u]=[Math.min(s,e),Math.max(c,e),Math.min(l,n),Math.max(u,n)]}return{ax:a,ay:o,u0:s,u1:c,v0:l,v1:u,at:(e,t)=>[e*a-t*o,e*o+t*a]}}function ye(e){let t=e[0];if(!t||e.length!==1||t.length<=5)return e;let n=ve(t),r=(n.u1-n.u0)*(n.v1-n.v0),i=K(t);if(r<=0||Math.abs(i)/r<.8)return e;let a=[n.at(n.u0,n.v0),n.at(n.u1,n.v0),n.at(n.u1,n.v1),n.at(n.u0,n.v1)];return[i>0?a:a.reverse()]}function q(e){let t=0,n=0,r=0;return e.forEach((i,a)=>{let o=e[(a+1)%e.length],s=i[0]*o[1]-o[0]*i[1];r+=s,t+=(i[0]+o[0])*s,n+=(i[1]+o[1])*s}),Math.abs(r)<1e-6?e[0]:[t/(3*r),n/(3*r)]}function be(e){if(e.length!==4)return!1;for(let t=0;t<4;t++){let n=e[t],r=e[(t+1)%4],i=e[(t+2)%4],a=[r[0]-n[0],r[1]-n[1]],o=[i[0]-r[0],i[1]-r[1]],s=(a[0]*o[0]+a[1]*o[1])/(Math.hypot(a[0],a[1])*Math.hypot(o[0],o[1]));if(Math.abs(s)>.25)return!1}return!0}function xe(e,t){let r=[],i=[],a=[],o=[],s=[],c=[],l=[],u=new fe(1),d=new fe(1),{ids:f,pisos:p,tipos:m,geometrias:h}=e.edificios,g=he(e),_=e.suelo?.puntos?.plaza,v=_?[_[0]/10,_[1]/10]:null,y=0;f.forEach((f,_)=>{if(t.has(f))return;let b=g.get(f);if(b===`piscina`||b===`plaza`)return;y++;let x=_e(U(f)),S=Math.max(1,p[_]??1),C=ue(f),w=0,T=h[_]?.[0]?.[0];if(v&&T&&T.length>=6){let e=0,t=0,n=Math.floor(T.length/2);for(let r=0;r<n*2;r+=2)e+=T[r],t+=T[r+1];let r=Math.hypot(e/n/10-v[0],t/n/10-v[1]);w=Math.max(0,1-r/480)}if(!b&&w>0&&m[_]===1){let e=_e(U(f+`:centro`));e()<.25+.65*w&&(C=e()<.62?3:5),e()<.85*w&&(S=Math.max(S,2)),e()<.6*w&&(S=Math.max(S,3)),e()<.3*w&&(S=4)}S>=3&&!oe.has(C)&&(C=3);let E=b===`coliseo`;E&&(S=3,C=0),b===`mercado`&&(S=2,C=0),b===`iglesia`?(S=3,C=2):b===`templo`?(S=2,C=6):b===`municipalidad`?(S=Math.max(S,5),C=3):b===`comisaria`?(S=Math.max(S,2),C=3):b===`hospital`||b===`clinica`||b===`essalud`?(S=Math.max(S,b===`clinica`?3:2),C=3):b===`colegio`&&(S=Math.max(S,2),C=x()<.5?3:0);let D=h[_]?.[0]?.[0];if(!b&&D&&D.length>=6&&oe.has(C)){let e=[];for(let t=0;t+1<D.length;t+=2)e.push([D[t]/10,D[t+1]/10]);Math.abs(K(e))>450&&(C=x()<.6?0:7)}let O=oe.has(C),k=x(),A,j=!1;if(b)A=E?G.concrete:G.painted;else if(O)A=k<.38?G.brick:k<.95?G.painted:G.concrete;else if(k<.3)A=x()<.5?G.brick:G.painted;else if(k<.92)j=!0,A=x()<.5?G.adobe:G.painted;else if(k<.975)j=!0,A=G.quincha;else{j=!0;let e=x();A=e<.45?G.wood:e<.75?G.sheet:G.mat}j&&(S=Math.min(S,A===G.adobe||A===G.painted?2:1));let M=A===G.brick?0:b?{iglesia:13,templo:8,municipalidad:15,comisaria:11,essalud:12,hospital:14,clinica:14,colegio:1}[b]??4:1+Math.floor(x()*10),N=m[_]===1?W.simulated:0;j&&(N|=W.earth),!b&&!j&&S>=2&&A!==G.concrete&&x()<.5&&(N|=W.unfinished),(b===`mercado`||!b&&x()<(S>=2?.45+.4*w:.2))&&(N|=W.shop),x()<.95&&(N|=W.meter);let P=S*2.75+(O?.3:.1),ee=x(),te=M+16*A+128*C+ge*N,F=i.length,I=l.length,[L,R,ne,z]=[1/0,1/0,-1/0,-1/0];for(let t of h[_]??[]){let u=b===`iglesia`||b===`templo`,d=(e.anchos&&!u?e=>e:ye)(t.map(e=>{let t=[];for(let n=0;n+1<e.length;n+=2)t.push([e[n]/10,e[n+1]/10]);return t})),f=d[0];if(!f||f.length<3)continue;let p=Math.abs(K(f));for(let e of f)L=Math.min(L,e[0]),R=Math.min(R,e[1]),ne=Math.max(ne,e[0]),z=Math.max(z,e[1]);{let e=K(f)>0?f:[...f].reverse(),t=e.length,n=c.length/3;e.forEach((n,r)=>{let i=e[(r-1+t)%t],a=e[(r+1)%t],o=Math.hypot(n[0]-i[0],n[1]-i[1])||1,s=Math.hypot(a[0]-n[0],a[1]-n[1])||1,l=[(n[1]-i[1])/o,-(n[0]-i[0])/o],u=[(a[1]-n[1])/s,-(a[0]-n[0])/s],d=l[0]+u[0],f=l[1]+u[1],p=Math.hypot(d,f)||1;d/=p,f/=p;let m=1.8*Math.min(2,1/Math.max(.5,d*u[0]+f*u[1]));c.push(n[0],n[1],1,n[0]+d*m,n[1]+f*m,0)});for(let e=0;e<t;e++){let r=(e+1)%t,i=n+2*e,a=n+2*r;l.push(i,a,a+1,i,a+1,i+1)}}let m=0,h=0;if(f.forEach((e,t)=>{let n=f[(t+1)%f.length],r=Math.hypot(n[0]-e[0],n[1]-e[1]);r>h&&([h,m]=[r,t])}),b===`iglesia`&&v){let e=q(f),t=v[0]-e[0],n=v[1]-e[1],r=Math.hypot(t,n)||1,i=-1;f.forEach((e,a)=>{let o=f[(a+1)%f.length],s=Math.hypot(o[0]-e[0],o[1]-e[1]);if(s<3)return;let c=Math.abs(((o[0]-e[0])*t+(o[1]-e[1])*n)/(s*r));c>i&&([i,m,h]=[c,a,s])})}let g=f[m],y=f[(m+1)%f.length],C=(y[0]-g[0])/h,w=(y[1]-g[1])/h,T=-w,D=C,k=e=>e[0]*C+e[1]*w,A=e=>e[0]*T+e[1]*D,M=1/0,F=-1/0;for(let e of f)M=Math.min(M,A(e)),F=Math.max(F,A(e));let I=Math.max(.5,F-M),B=!E&&!O&&d.length===1&&be(f)&&I>3&&(b===`iglesia`||b===`templo`||j&&x()<.08),re=!E&&!O&&!B,ie=B?Math.min(1,Math.max(.45,I*.1)):re?Math.min(.55,Math.max(.18,I*.045)):0,V=e=>re?P+ie*(A(e)-M)/I:P,H=(e,t,n,i,a,o,s=te)=>(r.push(e[0],e[1],t,n[0],n[1],n[2],i,a,o,P,S,ee,s,_),r.length/14-1);if(N&W.unfinished&&x()<.45){let e=K(f)>0?-1:1;s.push((g[0]+y[0])/2+T*e*2.2,(g[1]+y[1])/2+D*e*2.2,0,.8+x()*.4,Math.atan2(w,C),0)}if(d.forEach((e,t)=>{let n=(K(e)>0?1:-1)*(t===0?1:-1);e.forEach((r,a)=>{let o=e[(a+1)%e.length],s=o[0]-r[0],c=o[1]-r[1],l=Math.hypot(s,c);if(l<.05)return;let u=[n*c/l,n*-s/l,0],d=B?P:V(r),f=B?P:V(o),p=t===0&&a===m?te+ge*W.front:te,h=H(r,0,u,0,0,l,p),g=H(o,0,u,l,0,l,p),_=H(o,f,u,l,f,l,p),v=H(r,d,u,0,d,l,p);i.push(h,g,_,h,_,v)})}),B){let[e,t,n,r]=[0,1,2,3].map(e=>f[(m+e)%4]),a=q(f),o=(e,t=!1)=>{let n=.35*Math.sign(k(e)-k(a)),r=t?0:.35*Math.sign(A(e)-A(a));return[e[0]+C*n+T*r,e[1]+w*n+D*r]},s=(e,t)=>[(e[0]+t[0])/2,(e[1]+t[1])/2],c=s(r,e),l=s(t,n),u=P+ie,[d,p,h,g]=[o(e),o(t),o(n),o(r)],_=o(c,!0),v=o(l,!0),y=(e,t)=>{let n=[e[0][0],e[0][1],t[0]],r=[e[1][0],e[1][1],t[1]],a=[e[2][0],e[2][1],t[2]],o=r[0]-n[0],s=r[1]-n[1],c=r[2]-n[2],l=a[0]-n[0],u=a[1]-n[1],d=a[2]-n[2],f=[s*d-c*u,c*l-o*d,o*u-s*l],p=Math.hypot(...f)||1;f=[f[0]/p,f[1]/p,f[2]/p],f[2]<0&&(f=[-f[0],-f[1],-f[2]]);let m=e.map((e,n)=>H(e,t[n],f,k(e),A(e),0));i.push(m[0],m[1],m[2],m[0],m[2],m[3])};y([d,p,v,_],[P-.08,P-.08,u,u]),y([_,v,h,g],[u,u,P-.08,P-.08]);let b=(e,t,n)=>{let r=t[0]-e[0],a=t[1]-e[1],o=Math.hypot(r,a),s=K(f)>0?1:-1,c=[s*a/o,s*-r/o,0],l=te|0,d=H(e,P,c,0,P,o,l+ge*W.upper),p=H(t,P,c,o,P,o,l+ge*W.upper),m=H(n,u,c,o/2,u,o,l+ge*W.upper);i.push(d,p,m)};b(t,n,l),b(r,e,c)}else if(E){let e=1/0,t=-1/0;for(let n of f)e=Math.min(e,k(n)),t=Math.max(t,k(n));let n=(e,t)=>[C*e+T*t,w*e+D*t],r=I*.18,a=I*I/4/(2*r)+r/2,o=Math.asin(I/2/a),s=Array.from({length:11},(e,t)=>{let n=-o+2*o*t/10;return{w:(M+F)/2+a*Math.sin(n),z:P+a*Math.cos(n)-(a-r),t:n}});for(let r=0;r<10;r++){let a=s[r],o=s[r+1],c=(a.t+o.t)/2,l=[-Math.sin(c)*T,-Math.sin(c)*D,Math.cos(c)],u=[n(e-.4,a.w),n(t+.4,a.w),n(t+.4,o.w),n(e-.4,o.w)].map((e,t)=>H(e,t<2?a.z:o.z,l,k(e),A(e),0));i.push(u[0],u[1],u[2],u[0],u[2],u[3])}for(let[r,a]of[[e,-1],[t,1]]){let e=[C*a,w*a,0],t=te+ge*W.upper,o=H(n(r,(M+F)/2),P,e,I/2,P,I,t);for(let a=0;a<10;a++){let c=s[a],l=s[a+1],u=H(n(r,c.w),c.z,e,c.w-M,c.z,I,t),d=H(n(r,l.w),l.z,e,l.w-M,l.z,I,t);i.push(o,u,d)}}}else{let e=d.flat(),t=[],r=0;d.forEach((e,n)=>{n>0&&t.push(r),r+=e.length});let a=re?ie/I:0,o=[-a*T,-a*D,1],s=Math.hypot(...o);o=[o[0]/s,o[1]/s,o[2]/s];let c=e.map(e=>H(e,V(e),o,k(e),A(e),0));for(let r of n(e.flat(),t,2))i.push(c[r])}if(O&&p>25){let e=q(f);if(x()<.72){let t=f[Math.floor(x()*f.length)],n=.25+x()*.3;a.push(e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,P,.85+x()*.3,x()*6.28,x()<.75?6:1)}if(S<=2&&x()<.42){let t=Math.max(1,Math.floor(f.length/6));for(let n=0;n<f.length;n+=t){let t=f[n],r=e[0]-t[0],i=e[1]-t[1],a=Math.hypot(r,i)||1;o.push(t[0]+r/a*.25,t[1]+i/a*.25,P,1,x()*.3,0)}}}}i.length>F&&(u.add(F,i.length,L,R,ne,z,P+3),d.add(I,l.length,L-2,R-2,ne+2,z+2,.2))});let b=u.finish(Uint32Array.from(i),e=>new Uint32Array(e)),x=d.finish(Uint32Array.from(l),e=>new Uint32Array(e));return{vertices:new Float32Array(r),indices:b.data,chunks:b.table,skirtVertices:new Float32Array(c),skirtIndices:x.data,skirtChunks:x.table,tanks:new Float32Array(a),rebars:new Float32Array(o),works:new Float32Array(s),shown:y}}function Se(e){let t=[],n=[],r=e.arboles;for(let e=0;e+3<r.length;e+=4){let i=r[e]/10,a=r[e+1]/10,o=Math.min(32,r[e+2]/10),s=r[e+3]/10,c=_e(U(`${r[e]}_${r[e+1]}`)),l=c(),u=c();o<16&&u<.14?n.push(i,a,Math.max(6,o),Math.max(2.2,s*.9),l,0):t.push(i,a,o,s,l,+(u>.93))}return{trees:new Float32Array(t),palms:new Float32Array(n)}}function Ce(e){let t=[],n=[],r=[],i=[],a=[],o=[],s=/* @__PURE__ */ new Map,c=[],l=(e,t)=>{let n=`${Math.round(e)}_${Math.round(t)}`,r=s.get(n);return r===void 0&&(r=s.size,s.set(n,r),c.push(e,t)),r};for(let s of e.vias){let e=s[0]%10,c=(s.length-1)/2;if(c<2)continue;let u=t.length/2;for(let e=1;e<s.length;e+=2)t.push(s[e]/10,s[e+1]/10);n.push(u),r.push(c),i.push(l(s[1]/10,s[2]/10)),a.push(l(s[s.length-2]/10,s[s.length-1]/10)),o.push(e)}let u=Array.from({length:s.size},()=>[]);i.forEach((e,t)=>{u[e].push(t),u[a[t]].push(t)});let d=[],f=[];for(let e of u)d.push(f.length),f.push(...e);return d.push(f.length),{points:new Float32Array(t),edgeStart:new Int32Array(n),edgeCount:new Int32Array(r),edgeA:new Int32Array(i),edgeB:new Int32Array(a),edgeCode:new Uint8Array(o),adjStart:new Int32Array(d),adj:new Int32Array(f)}}function we(e,t){let n=/* @__PURE__ */ new Map;e.edificios.ids.forEach((r,i)=>{if(!t.has(r))for(let t of e.edificios.geometrias[i]??[]){let e=t[0];if(!e)continue;let r=[];for(let t=0;t+1<e.length;t+=2)r.push([e[t]/10,e[t+1]/10]);let i=q(r),a=`${Math.floor(i[0]/25)}_${Math.floor(i[1]/25)}`,o=n.get(a)??[];o.push(r),n.set(a,o)}});let r=(e,t=1)=>{let r=Math.floor(e[0]/25),i=Math.floor(e[1]/25),a=[];for(let e=r-t;e<=r+t;e++)for(let r=i-t;r<=i+t;r++)a.push(...n.get(`${e}_${r}`)??[]);return a},i=(e,t)=>{let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r],o=t[i];a[1]>e[1]!=o[1]>e[1]&&e[0]<(o[0]-a[0])*(e[1]-a[1])/(o[1]-a[1])+a[0]&&(n=!n)}return n},a=[],o=[],s=[],c=[],l=/* @__PURE__ */ new Map,u=e=>{let t=(e,t)=>`${Math.floor(e/10)}_${Math.floor(t/10)}`;for(let n=-1;n<=1;n++)for(let r=-1;r<=1;r++)for(let i of l.get(t(e[0]+n*10,e[1]+r*10))??[])if(Math.hypot(i[0]-e[0],i[1]-e[1])<14)return!0;return!1},d=e=>{let t=`${Math.floor(e[0]/10)}_${Math.floor(e[1]/10)}`,n=l.get(t)??[];n.push(e),l.set(t,n)},f=[.16,.16,.17],p=(e,t,n)=>{for(let r=0;r<5;r++)for(let i of[r/5,(r+1)/5]){let r=e[2]+(t[2]-e[2])*i-n*4*i*(1-i);c.push(e[0]+(t[0]-e[0])*i,e[1]+(t[1]-e[1])*i,r,0,0,1,...f,0)}},m=0;for(let t of e.vias){let e=t[0]%10,n=[];for(let e=1;e+1<t.length;e+=2)n.push([t[e]/10,t[e+1]/10]);if(n.length<2)continue;let c=e>=3?7.5:e===2?5.6:4.3,l=0,f=8,h=null;for(let t=0;t+1<n.length;t++){let g=n[t],_=n[t+1],v=Math.hypot(_[0]-g[0],_[1]-g[1]);if(v<.01)continue;let y=(_[0]-g[0])/v,b=(_[1]-g[1])/v;for(;f<=l+v;){let t=f-l;f+=34+m*7%5-2;let n=[g[0]+y*t+b*c,g[1]+b*t-y*c];if(u(n)||r(n).some(e=>i(n,e))){h=null;continue}d(n),m++;let _=Math.atan2(b,y),v=e>=2||m%2==0,x=m%7==0;(v?o:x?s:a).push(n[0],n[1],0,1,_,0);let S=-b,C=y,w=[.65,-.65].map(e=>[n[0]+S*e,n[1]+C*e,8.1]),T=[n[0]+S*.15,n[1]+C*.15,6.8];if(h){let e=Math.hypot(w[0][0]-h.top[0][0],w[0][1]-h.top[0][1]);e<55&&(w.forEach((t,n)=>p(h.top[n],t,e*.012)),p(h.low,T,e*.018))}h={top:w,low:T};let E=null;for(let e of r(n))for(let t of e){let e=Math.hypot(t[0]-n[0],t[1]-n[1]);e>3&&e<16&&(!E||e<E.d)&&(E={d:e,q:t})}E&&p(T,[E.q[0],E.q[1],2.9],.25)}l+=v}}return{poles:new Float32Array(a),lamps:new Float32Array(o),trafos:new Float32Array(s),lines:new Float32Array(c)}}var J=class{data=[];push(e,t,n,r){this.data.push(e[0],e[1],e[2],t[0],t[1],t[2],n[0],n[1],n[2],r)}tri(e,t,n,r,i,a){let o=a??Te(e,t,n);this.push(e,o,r,i),this.push(t,o,r,i),this.push(n,o,r,i)}quad(e,t,n,r,i,a){this.tri(e,t,n,i,a),this.tri(e,n,r,i,a)}box(e,t,n,r,i,a,o,s=0){let c=de(o),l=(e,t,n)=>[e,t,n];this.quad(l(e,t,a),l(r,t,a),l(r,i,a),l(e,i,a),c,s),this.quad(l(e,i,n),l(r,i,n),l(r,t,n),l(e,t,n),c,s),this.quad(l(r,t,n),l(r,i,n),l(r,i,a),l(r,t,a),c,s),this.quad(l(e,i,n),l(e,t,n),l(e,t,a),l(e,i,a),c,s),this.quad(l(e,t,n),l(r,t,n),l(r,t,a),l(e,t,a),c,s),this.quad(l(r,i,n),l(e,i,n),l(e,i,a),l(r,i,a),c,s)}cylinderZ(e,t,n,r,i,a,o=0,s=8){let c=de(a);for(let a=0;a<s;a++){let l=a/s*Math.PI*2,u=(a+1)/s*Math.PI*2,d=[e+Math.cos(l)*n,t+Math.sin(l)*n,r],f=[e+Math.cos(u)*n,t+Math.sin(u)*n,r],p=[Math.cos(l),Math.sin(l),0],m=[Math.cos(u),Math.sin(u),0],h=[d[0],d[1],i],g=[f[0],f[1],i];this.push(d,p,c,o),this.push(f,m,c,o),this.push(g,m,c,o),this.push(d,p,c,o),this.push(g,m,c,o),this.push(h,p,c,o),this.tri([e,t,i],h,g,c,o,[0,0,1])}}wheel(e,t,n,r,i){let a=de(`#1b1b1b`);for(let o=0;o<10;o++){let s=o/10*Math.PI*2,c=(o+1)/10*Math.PI*2,l=(t,i)=>[e+Math.cos(t)*r,i,n+Math.sin(t)*r],u=t-i/2,d=t+i/2;this.quad(l(s,u),l(c,u),l(c,d),l(s,d),a,0),this.tri([e,d,n],l(s,d),l(c,d),a,0),this.tri([e,u,n],l(c,u),l(s,u),a,0)}}cone(e,t,n,r,i,a=9){let o=de(i);for(let i=0;i<a;i++){let s=i/a*Math.PI*2,c=(i+1)/a*Math.PI*2;this.tri([e+Math.cos(s)*n,t+Math.sin(s)*n,0],[e+Math.cos(c)*n,t+Math.sin(c)*n,0],[e,t,r],o,0)}}plate(e,t,n,r,i,a,o=`#8d9092`){let s=de(a),c=de(o);for(let a=0;a<i;a++){let o=a/i*Math.PI*2+Math.PI/i,l=(a+1)/i*Math.PI*2+Math.PI/i,u=[e,t+Math.cos(o)*r,n+Math.sin(o)*r],d=[e,t+Math.cos(l)*r,n+Math.sin(l)*r];this.tri([e,t,n],d,u,s,0,[1,0,0]),this.tri([e-.02,t,n],[u[0]-.02,u[1],u[2]],[d[0]-.02,d[1],d[2]],c,0,[-1,0,0])}}build(){return new Float32Array(this.data)}};function Te(e,t,n){let r=[t[0]-e[0],t[1]-e[1],t[2]-e[2]],i=[n[0]-e[0],n[1]-e[1],n[2]-e[2]],a=[r[1]*i[2]-r[2]*i[1],r[2]*i[0]-r[0]*i[2],r[0]*i[1]-r[1]*i[0]],o=Math.hypot(...a)||1;return[a[0]/o,a[1]/o,a[2]/o]}function Ee(){let e=new J;e.wheel(1.08,0,.26,.26,.12),e.wheel(-.72,.56,.27,.27,.14),e.wheel(-.72,-.56,.27,.27,.14),e.box(.5,-.17,.34,1.22,.17,.84,`#ff00ff`,1),e.box(.95,-.4,1,1,.4,1.05,`#2b2b2b`),e.box(1.2,-.07,.68,1.26,.07,.8,`#fffbe6`,2),e.box(.3,-.2,.85,.62,.2,1.38,`#ffffff`,4),e.box(.34,-.13,1.38,.58,.13,1.64,`#1c1c1c`),e.box(-1.15,-.62,.3,.45,.62,.55,`#262626`),e.box(-1.15,-.62,.55,-.92,.62,1.25,`#ff00ff`,1),e.box(-.92,.57,.55,.3,.62,.95,`#ff00ff`,1),e.box(-.92,-.62,.55,.3,-.57,.95,`#ff00ff`,1),e.box(-.9,-.55,.55,-.42,.55,.85,`#6b1d1d`),e.box(-1.22,-.68,1.7,.78,.68,1.82,`#ff00ff`,1);for(let t of[-1.15,.7])for(let n of[-.62,.58])e.box(t,n,.9,t+.05,n+.04,1.71,`#222222`);return e.box(.72,-.52,1.02,.76,.52,1.66,`#9ec5d8`,3),e.box(-1.2,.3,.6,-1.16,.5,.7,`#ff2a2a`,5),e.box(-1.2,-.5,.6,-1.16,-.3,.7,`#ff2a2a`,5),e.build()}function De(){let e=new J;for(let t of[-.75,.65])e.box(t,-.22,0,t+.1,.22,.42,`#b9b4aa`);return e.box(-.85,-.24,.42,.85,.24,.48,`#7a5233`),e.box(-.85,.2,.5,.85,.25,.85,`#7a5233`),e.build()}function Oe(){let e=new J;return e.box(-1.3,-1.3,0,1.3,1.3,.3,`#c9c4b8`),e.box(-.55,-.55,.3,.55,.55,2.3,`#d6d0c2`),e.box(-.45,-.32,2.3,.45,.32,2.75,`#5d4a2c`,6),e.cylinderZ(0,0,.17,2.75,3.12,`#5d4a2c`,6,8),e.build()}function ke(){let e=new J;return e.box(-.03,-.03,0,.03,.03,2.35,`#8d9092`),e.plate(.05,0,2.3,.38,8,`#f2f2f2`),e.plate(.06,0,2.3,.33,8,`#c8202a`),e.build()}function Ae(e,t){let n=new J;n.box(-.9,-.45,0,.9,.45,.8,`#6e5238`),n.box(-.85,-.4,.8,.85,.4,.95,t);for(let e of[-1.1,1.05])for(let t of[-.85,.8])n.box(e,t,0,e+.05,t+.05,2.3,`#4a4a4a`);return n.box(-1.2,-1,2.3,1.2,1,2.36,e),n.build()}function je(e,t){let n=new J;for(let e of[3.9,-3.2,-4.4])for(let t of[1.1,-1.1])n.wheel(e,t,.5,.5,.3);return n.box(-6,-1.25,.45,6,1.25,3.4,e),n.box(-5.9,-1.27,1.9,5.3,1.27,2.9,`#27323b`,3),n.box(5.98,-1.15,1.4,6.02,1.15,3.1,`#27323b`,3),n.box(-6.01,-1.26,.9,6.01,1.26,1.3,t),n.box(5.98,.6,.7,6.03,1,.9,`#fffbe6`,2),n.box(5.98,-1,.7,6.03,-.6,.9,`#fffbe6`,2),n.build()}function Me(e,t){let n=new J,r=`#f4f4f2`;for(let i of[-e/2,e/2])n.box(-.06,i-.06,0,.06,i+.06,t,r);return n.box(-.06,-e/2,t-.06,.06,e/2,t+.06,r),n.box(-1.2,-e/2,0,-1.18,e/2,t*.8,`#d8d8d4`),n.build()}function Ne(){let e=new J;return e.box(-.12,-.12,0,.12,.12,.4,`#2e3b33`),e.box(-.05,-.05,.4,.05,.05,3.6,`#2e3b33`),e.box(-.16,-.16,3.6,.16,.16,4.05,`#ffe2a8`,2),e.box(-.2,-.2,4.05,.2,.2,4.15,`#2e3b33`),e.build()}function Pe(){let e=new J,t=`#f3f1ea`;e.box(-1.85,-1.85,0,1.85,1.85,.35,t);let n=1.55;for(let t=0;t<6;t++){let r=t/6*(Math.PI/2),i=(t+1)/6*(Math.PI/2),a=n*Math.cos((r+i)/2);e.cylinderZ(0,0,a,.35+n*Math.sin(r),.35+n*Math.sin(i),`#f0b323`,0,12)}return e.cylinderZ(0,0,.32,1.9-.05,2.55,t,0,8),e.cylinderZ(0,0,.4,2.55,1.9+.78,t,0,8),e.box(-.06,-.06,1.9+.78,.06,.06,3.9799999999999995,`#d9d6cf`),e.box(-.06,-.38,3.4799999999999995,.06,.38,3.5999999999999996,`#d9d6cf`),e.build()}function Fe(){let e=new J;return e.box(-.6,-.6,0,.6,.6,.5,`#bdb8ad`),e.cylinderZ(0,0,.06,.5,9.2,`#d4d6d8`,0,6),e.box(-.02,.08,8,.02,.78,9.1,`#d91023`),e.box(-.02,.78,8,.02,1.48,9.1,`#ffffff`),e.box(-.02,1.48,8,.02,2.18,9.1,`#d91023`),e.build()}function Ie(){let e=new J;for(let t of[-1,1])e.box(t-.05,-.05,0,t+.05,.05,1.2,`#8c9196`);return e.box(-1.3,-.08,1.2,1.3,.08,3.6,`#f4f4f2`),e.box(-.28,-.1,1.55,.28,.1,3.25,`#d32f2f`,2),e.box(-.85,-.1,2.12,.85,.1,2.68,`#d32f2f`,2),e.build()}function Le(){let e=new J;e.box(-5.2,-5.2,0,5.2,5.2,.3,`#c9c9c4`),e.box(-4.6,-4.6,.3,4.6,4.6,.6,`#d3d3ce`),e.box(-4,-4,.6,4,4,.95,`#dcdcd7`);let t=`#2fb2ad`;for(let n=-4;n<=4;n++)for(let[r,i]of[[n*.95,-3.85],[n*.95,3.85],[-3.85,n*.95],[3.85,n*.95]])e.box(r-.04,i-.04,.95,r+.04,i+.04,1.75,t);for(let n of[-1,1])e.box(-3.9,n*3.85-.05,1.68,3.9,n*3.85+.05,1.78,t),e.box(n*3.85-.05,-3.9,1.68,n*3.85+.05,3.9,1.78,t);for(let[t,n,r,i]of[[-2.1,-.4,.55,5.6],[-1.15,-.9,.65,7.4],[0,-.5,.7,9],[1.15,-1,.6,7.8],[2.1,-.3,.55,5.2],[-.6,1,.75,4.6],[.8,1.1,.7,5]])e.box(t-r/2,n-.85,.95,t+r/2,n+.85,.95+i,`#e1e1db`);for(let t of[-2.6,0,2.6])e.cylinderZ(t,-3.2,.07,.95,13.5,`#eceeef`,0,6);e.box(0,-3.17,12.2,.02,-3.17+.7,13.3,`#d91023`),e.box(0,-2.47,12.2,.02,-2.47+.7,13.3,`#ffffff`),e.box(0,-1.77,12.2,.02,-1.07,13.3,`#d91023`);let n=`#5d4a2c`;return e.box(-.5,2.2,.95,.5,3.1,2.1,`#a3a19a`),e.box(-.22,2.45,2.1,.22,2.85,3.2,n,6),e.box(-.26,2.43,3.2,.26,2.87,4,n,6),e.cylinderZ(0,2.65,.16,4,4.32,n,6,8),e.build()}function Re(){let e=new J;e.box(-.13,-.13,0,.13,.13,.5,`#4a5056`),e.cylinderZ(0,0,.06,.5,3.7,`#5b6166`,0,8),e.box(-.5,-.03,3.62,.5,.03,3.7,`#5b6166`);for(let t of[-.5,.5])for(let n=0;n<4;n++){let r=-Math.PI/2+n/4*Math.PI,i=-Math.PI/2+(n+1)/4*Math.PI,a=.22*Math.cos((r+i)/2);e.cylinderZ(t,0,a,3.92+.22*Math.sin(r),3.92+.22*Math.sin(i),`#fffaf0`,2,10)}return e.build()}let Y={lot:0,asphalt:1,dirt:2,sidewalk:3,curb:4,grass:5,tiles:6,path:7,pitch:8,court:9,water:10,earth:11,concrete:12,zebra:14,river:17,riverBand:18,paint:15,wall:16,model:100},X={dirt:.03,asphalt:.06,mark:.09,area:.08,field:.11,path:.14,cross:.16,center:.18,curb:.2},ze=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)};var Be=class{data=[];vertex(e,t,n,r){this.data.push(e[0],e[1],e[2],t[0],t[1],t[2],n,r[0],r[1],r[2])}quad(e,t,n,r){for(let i of[0,1,2,0,2,3])this.vertex(e[i],t,n,r[i])}model(e,t,n,r,i,a=1,o){let s=Math.cos(i),c=Math.sin(i);for(let i=0;i<e.length;i+=10){let l=e[i+9],u=o&&(l===1||l===4)?o:[e[i+6],e[i+7],e[i+8]],d=e[i]*a,f=e[i+1]*a,p=e[i+3],m=e[i+4];this.vertex([t+s*d-c*f,n+c*d+s*f,r+e[i+2]*a],[s*p-c*m,c*p+s*m,e[i+5]],Y.model+(o&&(l===1||l===4)?0:l),u)}}box(e,t,n,r,i,a,o,s,c=0){let l=de(s),u=Math.cos(n),d=Math.sin(n),f=(n,r,i)=>[e+u*n-d*r,t+d*n+u*r,i],p=r/2,m=i/2,h=[l,l,l,l],g=Y.model+c;this.quad([f(-p,-m,o),f(p,-m,o),f(p,m,o),f(-p,m,o)],[0,0,1],g,h),this.quad([f(p,-m,a),f(p,m,a),f(p,m,o),f(p,-m,o)],[u,d,0],g,h),this.quad([f(-p,m,a),f(-p,-m,a),f(-p,-m,o),f(-p,m,o)],[-u,-d,0],g,h),this.quad([f(-p,-m,a),f(p,-m,a),f(p,-m,o),f(-p,-m,o)],[d,-u,0],g,h),this.quad([f(p,m,a),f(-p,m,a),f(-p,m,o),f(p,m,o)],[-d,u,0],g,h)}polygon(e,t,r,i){for(let a of n(e.flat(),void 0,2)){let n=e[a];this.vertex([n[0],n[1],t],[0,0,1],r,i(n))}}};function Ve(e){let t=[];for(let n of e){let e=t[t.length-1];(!e||Math.hypot(n[0]-e[0],n[1]-e[1])>.05)&&t.push(n)}let n=[0];for(let e=1;e<t.length;e++)n.push(n[e-1]+Math.hypot(t[e][0]-t[e-1][0],t[e][1]-t[e-1][1]));return{pts:t,s:n}}let He=e=>e.s[e.s.length-1]??0;function Z(e,t){let n=0;for(;n<e.pts.length-2&&e.s[n+1]<t;)n++;let r=e.pts[n],i=e.pts[n+1],a=e.s[n+1]-e.s[n]||1,o=Math.min(1,Math.max(0,(t-e.s[n])/a)),s=(i[0]-r[0])/a,c=(i[1]-r[1])/a;return{p:[r[0]+(i[0]-r[0])*o,r[1]+(i[1]-r[1])*o],dx:s,dy:c}}function Ue(e,t,n){let r=[Z(e,t).p],i=[t];return e.s.forEach((a,o)=>{a>t+.05&&a<n-.05&&(r.push(e.pts[o]),i.push(a))}),r.push(Z(e,n).p),i.push(n),{pts:r,s:i}}function We(e){let t=e.pts.length,n=t=>{let n=e.pts[t],r=e.pts[t+1],i=Math.hypot(r[0]-n[0],r[1]-n[1])||1;return[-(r[1]-n[1])/i,(r[0]-n[0])/i]};return e.pts.map((e,r)=>{if(r===0)return n(0);if(r===t-1)return n(t-2);let i=n(r-1),a=n(r),o=i[0]+a[0],s=i[1]+a[1],c=Math.hypot(o,s);if(c<1e-6)return i;o/=c,s/=c;let l=1/Math.max(.5,o*a[0]+s*a[1]);return[o*l,s*l]})}function Q(e,t,n,r,i,a,o){let s=We(t);for(let c=0;c+1<t.pts.length;c++){let l=(e,n)=>[t.pts[e][0]+s[e][0]*n,t.pts[e][1]+s[e][1]*n,i];e.quad([l(c,n),l(c+1,n),l(c+1,r),l(c,r)],[0,0,1],a,[o(t.s[c],n),o(t.s[c+1],n),o(t.s[c+1],r),o(t.s[c],r)])}}function Ge(e,t,n,r,i,a,o){let s=We(t),c=n>0?-1:1;for(let l=0;l+1<t.pts.length;l++){let u=t.pts[l],d=t.pts[l+1],f=Math.hypot(d[0]-u[0],d[1]-u[1])||1,p=[-(d[1]-u[1])/f*c,(d[0]-u[0])/f*c,0],m=(e,r)=>[t.pts[e][0]+s[e][0]*n,t.pts[e][1]+s[e][1]*n,r];e.quad([m(l,r),m(l+1,r),m(l+1,i),m(l,i)],p,a,[[t.s[l],r,o],[t.s[l+1],r,o],[t.s[l+1],i,o],[t.s[l],i,o]])}}function Ke(e,t){let n=[],r=0;for(let[i,a]of[...t].sort((e,t)=>e[0]-t[0]))i>r&&n.push([r,Math.min(i,e)]),r=Math.max(r,a);return r<e&&n.push([r,e]),n.filter(([e,t])=>t-e>1.2)}function qe(e,t){let n=!1;for(let r=0,i=t.length-1;r<t.length;i=r++){let a=t[r],o=t[i];a[1]>e[1]!=o[1]>e[1]&&e[0]<(o[0]-a[0])*(e[1]-a[1])/(o[1]-a[1])+a[0]&&(n=!n)}return n}function Je(e){let t=0,n=1,r=0;e.forEach((i,a)=>{let o=e[(a+1)%e.length],s=Math.hypot(o[0]-i[0],o[1]-i[1]);s>t&&([t,n,r]=[s,(o[0]-i[0])/s,(o[1]-i[1])/s])});let[i,a,o,s]=[1/0,-1/0,1/0,-1/0];for(let t of e){let e=t[0]*n+t[1]*r,c=-t[0]*r+t[1]*n;[i,a,o,s]=[Math.min(i,e),Math.max(a,e),Math.min(o,c),Math.max(s,c)]}let c=(a-i)/2,l=(s-o)/2,u=(i+a)/2,d=(o+s)/2,f=[u*n-d*r,u*r+d*n];return l>c&&([c,l]=[l,c],[n,r]=[-r,n]),{center:f,ax:n,ay:r,hl:c,hw:l}}function Ye(e,t,n){let r=1/0;return e.forEach((i,a)=>{let o=e[(a+1)%e.length],s=o[0]-i[0],c=o[1]-i[1],l=n[0]*c-n[1]*s;if(Math.abs(l)<1e-9)return;let u=((i[0]-t[0])*c-(i[1]-t[1])*s)/l,d=((i[0]-t[0])*n[1]-(i[1]-t[1])*n[0])/l;u>0&&d>=0&&d<=1&&(r=Math.min(r,u))}),Number.isFinite(r)?r:0}function Xe(e,t){let n=e.length;return e.map((r,i)=>{let a=e[(i-1+n)%n],o=e[(i+1)%n],s=Ze([-(r[1]-a[1]),r[0]-a[0]]),c=Ze([-(o[1]-r[1]),o[0]-r[0]]),l=s[0]+c[0],u=s[1]+c[1],d=Math.hypot(l,u)||1;l/=d,u/=d;let f=Math.min(2,1/Math.max(.5,l*c[0]+u*c[1]));return[r[0]+l*t*f,r[1]+u*t*f]})}let Ze=e=>{let t=Math.hypot(e[0],e[1])||1;return[e[0]/t,e[1]/t]},Qe=(e,t=0)=>{let n=[];for(let r=t;r+1<e.length;r+=2)n.push([e[r]/10,e[r+1]/10]);return K(n)<0&&n.reverse(),n};function $e(e){let t=new Be,r=new Be,i=new Be,a=new Be,o=[],s=(e,t,n,r,i,a=0)=>{if(He(e)<4||i<=0)return;let s=We(e);o.push({pts:e.pts.map((e,n)=>[e[0]+s[n][0]*t,e[1]+s[n][1]*t]),z:n,weight:r,half:i,kind:a})},c=[],l=[],u=e.suelo,d=u?.puntos??{},f=d.plaza?[d.plaza[0]/10,d.plaza[1]/10]:[0,0],p=(e,t)=>(Math.floor(t/40)+2e3)*5e3+Math.floor(e/40)+2e3,m=(e,t,n,r)=>{let i=p(t,n),a=e.get(i);a?a.push(r):e.set(i,[r])},h=(e,t,n)=>{let r=p(t[0],t[1]);for(let t=-1;t<=1;t++)for(let i=-1;i<=1;i++){let a=e.get(r+t*5e3+i);if(a){for(let e of a)if(n(e))return!0}}return!1},g=/* @__PURE__ */ new Map,_=/* @__PURE__ */ new Map,v=/* @__PURE__ */ new Map,y=[],b=/* @__PURE__ */ new Map;e.edificios.ids.forEach((t,n)=>{let r=e.edificios.geometrias[n]??[];b.set(t,r);for(let e of r){if(!e[0])continue;let t=Qe(e[0]);if(t.length<3)continue;let n=q(t);y.push(n);let r=p(n[0],n[1]);g.set(r,(g.get(r)??0)+1),m(_,n[0],n[1],t),m(v,n[0],n[1],n)}});let x=e=>h(_,e,t=>qe(e,t)),S=e=>{let t=p(e[0],e[1]),n=0;for(let e=-1;e<=1;e++)for(let r=-1;r<=1;r++)n+=g.get(t+e*5e3+r)??0;let r=ze(300,1400,Math.hypot(e[0]-f[0],e[1]-f[1]));return Math.min(1,Math.max(0,.55*r+.7*(1-Math.min(1,n/24))-.12))},C=/* @__PURE__ */ new Map;for(let t=0;t+3<e.arboles.length;t+=4)m(C,e.arboles[t]/10,e.arboles[t+1]/10,[e.arboles[t]/10,e.arboles[t+1]/10]);let w=(e,t,n,r)=>{h(C,e,t=>Math.hypot(t[0]-e[0],t[1]-e[1])<4.5)||(c.push(e[0],e[1],t,n,r,0),m(C,e[0],e[1],e))},T=[];e.vias.forEach((t,n)=>{let r=[];for(let e=1;e+1<t.length;e+=2)r.push([t[e]/10,t[e+1]/10]);let i=Ve(r);if(i.pts.length<2||He(i)<1)return;let a=me(t[0]),o=_e(U(`via${n}`)),s=S(Z(i,He(i)/2).p),c=!a.unpaved&&(a.code>=3||o()<1-.78*ze(.25,.85,s)),l=a.code===4?5:a.code===3?4.5:a.code===2?4:3.2,u=e.anchos?.[n],d=u?u[0]/10:c?l:Math.min(l,3),f=s<.25?2.2:1.7,p=u?Math.max(0,u[1]/10-d):f,m=u?Math.max(0,u[2]/10-d):f,h=u?c&&Math.max(p,m)>=.4:c&&(a.malecon||s<.45||o()<.4)&&!(a.code===4&&s>.6);T.push({l:i,code:a.code,hw:c?d:Math.min(d,3),paved:c,walk:h,sw:Math.max(p,m),swL:p,swR:m,green:a.green&&h&&Math.min(p,m)>=2.6&&o()<.75,malecon:a.malecon,berma:a.green,zone:s,r:o})});let E=/* @__PURE__ */ new Map,D=e=>`${Math.round(e[0])}_${Math.round(e[1])}`;for(let e of T)e.l.pts.forEach((t,n)=>{let r=E.get(D(t))??{degree:0,hw:0};r.degree+=n===0||n===e.l.pts.length-1?1:2,r.hw=Math.max(r.hw,e.hw),E.set(D(t),r)});let O=0,k=ke(),A=Ne(),j=Re(),M=De();for(let e of T){let{l:t,hw:n,r:o}=e,c=He(t),l=e.paved?X.asphalt:X.dirt;e.paved?Q(i,t,-n,n,l,Y.asphalt,(t,n)=>[t,n,e.code===4?0:1]):Q(r,t,-n-.6,n+.6,l,Y.dirt,(e,t)=>[e,t,n]);let u=t.pts.map((e,n)=>({s:t.s[n],n:E.get(D(e))})).filter(e=>e.n.degree>=3);if(e.walk){let r=u.map(t=>[t.s-t.n.hw-e.sw-.4,t.s+t.n.hw+e.sw+.4]),d=+(e.zone<.2&&o()<.35);for(let[u,f]of Ke(c,r)){let r=Ue(t,u,f);for(let t of[1,-1]){let c=t===1?e.swL:e.swR;if(c<.4&&!(e.malecon&&t===-1))continue;if(Ge(i,r,t*n,l,X.curb,Y.curb,d),e.malecon&&t===-1){let e=5.5;Q(i,r,-n,-n-e,X.curb,Y.tiles,(t,r)=>[t,-r-n-e/2,e/2]);let t=He(r);s(r,-n-e/2,X.curb,2.5,2.2,2);for(let i=0;i+2.5<=t;i+=2.5){let{p:o,dx:s,dy:c}=Z(r,i),l=-n-e+.15;a.box(o[0]-c*l,o[1]+s*l,Math.atan2(c,s),.08,.08,X.curb,X.curb+1,`#e9e7e0`);let u=Z(r,Math.min(t,i+1.25));a.box(u.p[0]-u.dy*l,u.p[1]+u.dx*l,Math.atan2(u.dy,u.dx),2.5,.07,X.curb+.92,X.curb+1.02,`#e9e7e0`),a.box(u.p[0]-u.dy*l,u.p[1]+u.dx*l,Math.atan2(u.dy,u.dx),2.5,.04,X.curb+.45,X.curb+.5,`#e9e7e0`)}for(let i=6;i<t-2;i+=14){let{p:t,dx:s,dy:c}=Z(r,i),l=Math.atan2(c,s),u=e=>[t[0]-c*e,t[1]+s*e],d=u(-n-e+1.1);a.model(M,d[0],d[1],X.curb,l);let f=u(-n-1.1);if(i/14%2<1)w(f,6+o()*2,2.4+o()*.6,o());else{let e=u(-n-.5);a.model(A,e[0],e[1],X.curb,l)}}continue}let u=n,f=c;e.green&&c>=2.6&&(Q(i,r,t*n,t*(n+1.3),X.curb-.04,Y.grass,(e,t)=>[e,Math.abs(t),0]),u=n+1.3,f=c-1.3);let p=u;Q(i,r,t*u,t*(u+f),X.curb,Y.sidewalk,(e,t)=>[e,Math.abs(t),p]),e.zone<.65&&f>1.2&&s(r,t*(u+f/2),X.curb,.3+1.6*(1-e.zone),f/2-.4)}}}if(e.paved){if(e.zone<.35)for(let e of u)for(let r of[-1,1]){let a=e.s+r*(e.n.hw+.8),o=e.s+r*(e.n.hw+3.8),[s,l]=a<o?[a,o]:[o,a];s<0||l>c||Q(i,Ue(t,s,l),-n+.3,n-.3,X.mark,Y.zebra,(e,t)=>[e,t,0])}if(e.code>=3){let e=u.map(e=>[e.s-e.n.hw-7,e.s+e.n.hw+7]);for(let[n,r]of Ke(c,e))Q(i,Ue(t,n,r),-.08,.08,X.mark,Y.paint,(e,t)=>[e,t,0])}if(e.code<=2&&e.zone<.8)for(let r of u)for(let i of[1,-1]){if(o()>.28)continue;let s=r.s-i*(r.n.hw+1.4);if(s<0||s>c)continue;let{p:l,dx:u,dy:d}=Z(t,s),f=-i*(n+(e.walk?.6:.4));a.model(k,l[0]-d*f,l[1]+u*f,e.walk?X.curb:0,Math.atan2(-d*i,-u*i)),O++}}}let N=(u?.areas??[]).map(e=>({tipo:e[0],ring:Qe(e,1)})).filter(e=>e.ring.length>=3),P=N.filter(e=>e.tipo===1).sort((e,t)=>K(t.ring)-K(e.ring)),ee=N.filter(e=>e.tipo===3),te=e=>t=>[t[0]-e[0],t[1]-e[1],999],F=0;for(let e of N){let{tipo:t,ring:n}=e,r=_e(U(`area${n[0][0].toFixed(1)}${n[0][1].toFixed(1)}`)),o=q(n);if(t===1||t===2){let c=P[0]===e,l=t===1;i.polygon(n,X.area,Y.grass,e=>[e[0],e[1],1]);let u=l?3:2.2,d=Xe(n,u),f=Xe(n,u/2);s(Ve([...f,f[0]]),0,X.path,l?3:1.5,u/2-.4,1);let p=0;n.forEach((e,t)=>{let r=n[(t+1)%n.length],o=d[t],s=d[(t+1)%n.length],c=Math.hypot(r[0]-e[0],r[1]-e[1]);if(i.quad([[e[0],e[1],X.path],[r[0],r[1],X.path],[s[0],s[1],X.path],[o[0],o[1],X.path]],[0,0,1],l?Y.tiles:Y.path,[[p,-u/2,u/2],[p+c,-u/2,u/2],[p+c,u/2,u/2],[p,u/2,u/2]]),l)for(let e=6;e<c-3;e+=16){let t=e/c,n=[o[0]+(s[0]-o[0])*t,o[1]+(s[1]-o[1])*t];a.model(j,n[0],n[1],X.path,0)}p+=c});let m=Je(n),h=l?Math.min(9,.12*Math.sqrt(K(n))):2.5,g=l?1.6:1.2,_=[[m.ax,m.ay],[-m.ax,-m.ay],[-m.ay,m.ax],[m.ay,-m.ax]];if(l)for(let[e,t]of[[1,1],[1,-1],[-1,1],[-1,-1]])_.push(Ze([m.ax*m.hl*e-m.ay*m.hw*t,m.ay*m.hl*e+m.ax*m.hw*t]));let v=_.map(e=>Math.atan2(e[1],e[0])).sort((e,t)=>e-t);for(let e of _){let t=Ye(n,o,e)-.5;if(t<h+2)continue;let r=Ve([[o[0]+e[0]*h*.8,o[1]+e[1]*h*.8],[o[0]+e[0]*t,o[1]+e[1]*t]]);Q(i,r,-g,g,X.cross,l?Y.tiles:Y.path,(e,t)=>[e,t,g]),s(r,0,X.cross,l?3:1.5,g-.45,1);let c=Math.atan2(e[1],e[0]);for(let n=h+3;n<t-3;n+=7)for(let t of[1,-1]){let r=t*(g+.45),i=[o[0]+e[0]*n-e[1]*r,o[1]+e[1]*n+e[0]*r];a.model(M,i[0],i[1],X.area,t>0?c:c+Math.PI),F++}}if(v.forEach((e,t)=>{let i=(e+(t+1<v.length?v[t+1]:v[0]+Math.PI*2))/2,a=[Math.cos(i),Math.sin(i)],s=Ye(n,o,a);for(let e of l?[.45,.78]:[.6]){let t=[o[0]+a[0]*s*e,o[1]+a[1]*s*e];s*e>h+3&&qe(t,n)&&w(t,6.5+r()*1.8,3+r()*.8,r())}}),l){let e=Array.from({length:20},(e,t)=>[o[0]+Math.cos(t/20*Math.PI*2)*h,o[1]+Math.sin(t/20*Math.PI*2)*h]);i.polygon(e,X.center,Y.tiles,te(o));let t=Math.atan2(m.ay,m.ax);a.model(c?Le():Oe(),o[0],o[1],X.center,t)}}else if(t===3)i.polygon(n,X.area-.02,Y.earth,e=>[e[0],e[1],0]),n.forEach((e,t)=>{let r=n[(t+1)%n.length],i=Math.hypot(r[0]-e[0],r[1]-e[1]);a.box((e[0]+r[0])/2,(e[1]+r[1])/2,Math.atan2(r[1]-e[1],r[0]-e[0]),i+.2,.25,0,3,`#d8cfb8`)});else if(t===4||t===5){let e=Je(n),r=Math.atan2(e.ay,e.ax),o=(t,n)=>[e.center[0]+e.ax*e.hl*t-e.ay*e.hw*n,e.center[1]+e.ay*e.hl*t+e.ax*e.hw*n,X.field],s=Math.round(e.hw)*1e3+e.hl;i.quad([o(-1,-1),o(1,-1),o(1,1),o(-1,1)],[0,0,1],t===4?Y.pitch:Y.court,[[-e.hl,-e.hw,s],[e.hl,-e.hw,s],[e.hl,e.hw,s],[-e.hl,e.hw,s]]);let c=e.hw>18;for(let t of[1,-1]){let n=Me(c?7.32:3,c?2.44:2),i=e.hl-(c?1.5:.6);a.model(n,e.center[0]+e.ax*i*t,e.center[1]+e.ay*i*t,X.field,t>0?r+Math.PI:r)}if(ee.some(t=>qe(e.center,t.ring)))for(let t of[1,-1]){for(let n=0;n<7;n++){let i=e.hw+3+n*.9+.45;a.box(e.center[0]-e.ay*i*t,e.center[1]+e.ax*i*t,r,e.hl*1.4,.9,0,.5+n*.45,n%2?`#c9c4b8`:`#bdb7aa`)}if(t>0){let t=e.hw+3+6.3;for(let n=-.6;n<=.61;n+=.3)a.box(e.center[0]+e.ax*e.hl*n-e.ay*(t+.2),e.center[1]+e.ay*e.hl*n+e.ax*(t+.2),r,.3,.3,0,7,`#9a9a96`);let n=e.hw+3+6.3/2;a.box(e.center[0]-e.ay*n,e.center[1]+e.ax*n,r,e.hl*1.45,7.9,6.9,7.1,`#8fa4b1`)}}}else t===6||t===8?i.polygon(n,X.area-.02,Y.concrete,e=>[e[0],e[1],0]):t===7&&i.polygon(n,X.area-.02,Y.earth,e=>[e[0],e[1],0])}let I=he(e),L=[`#2f6fb0`,`#c23b2e`,`#e0892b`,`#2f8f57`,`#e2c23a`,`#6b4fa0`],R=Ee(),ne=[`#d9473b`,`#e7b32f`,`#6aa84f`,`#c97a3a`,`#f0e0c0`],z=0;for(let[e,t]of I){let n=b.get(e),r=n?.[0]?.[0]?Qe(n[0][0]):null;if(!r||r.length<3)continue;let o=_e(U(`lugar${e}`));if(t===`mercado`){r.forEach((e,t)=>{let n=r[(t+1)%r.length],i=Math.hypot(n[0]-e[0],n[1]-e[1]);if(i<6)return;let s=(n[0]-e[0])/i,c=(n[1]-e[1])/i;for(let t=2.2;t<i-2;t+=3.2){if(o()>.6)continue;let n=[e[0]+s*t+c*1.8,e[1]+c*t-s*1.8];if(x(n))continue;let r=Ae(L[Math.floor(o()*L.length)],ne[Math.floor(o()*ne.length)]);a.model(r,n[0],n[1],X.curb,Math.atan2(c,s)),z++}for(let t=3;t<i-3&&i>14;t+=2.1){if(o()>.45)continue;let n=[e[0]+s*t+c*6.2,e[1]+c*t-s*6.2];if(x(n))continue;let r=L[Math.floor(o()*L.length)];a.model(R,n[0],n[1],X.asphalt,Math.atan2(-s,c)+(o()-.5)*.3,1,de(r))}});let e=Xe(r,-3.4);s(Ve([...e,e[0]]),0,X.curb,9,.9,3)}else if(t===`piscina`){i.polygon(r,.3,Y.concrete,e=>[e[0],e[1],1]);let e=(u?.piscinas??[]).map(e=>Qe(e)).find(e=>e.length>=3&&qe(q(e),r)),t=Je(e??r),n=e?t.hl:Math.max(3,Math.min(12.5,t.hl-3)),o=e?t.hw:Math.max(2,Math.min(6.25,t.hw-3)),s=(e,r)=>[t.center[0]+t.ax*n*e-t.ay*o*r,t.center[1]+t.ay*n*e+t.ax*o*r,.33];i.quad([s(-1,-1),s(1,-1),s(1,1),s(-1,1)],[0,0,1],Y.water,[[-n,-o,0],[n,-o,0],[n,o,0],[-n,o,0]]),r.forEach((e,t)=>{let n=r[(t+1)%r.length],i=Math.hypot(n[0]-e[0],n[1]-e[1]);a.box((e[0]+n[0])/2,(e[1]+n[1])/2,Math.atan2(n[1]-e[1],n[0]-e[0]),i+.2,.2,0,2.2,`#5d8fb5`)})}}let B=0;if(d.terminal){let e=[d.terminal[0]/10,d.terminal[1]/10],t={d:1/0,dx:1,dy:0};for(let n of T)for(let r=0;r+1<n.l.pts.length;r++){let i=n.l.pts[r],a=n.l.pts[r+1],o=Math.hypot((i[0]+a[0])/2-e[0],(i[1]+a[1])/2-e[1]),s=Math.hypot(a[0]-i[0],a[1]-i[1])||1;o<t.d&&(t={d:o,dx:(a[0]-i[0])/s,dy:(a[1]-i[1])/s})}let n=e=>T.some(t=>t.l.pts.some(n=>Math.hypot(n[0]-e[0],n[1]-e[1])<t.hw+3)),r=[[`#f2f0ea`,`#c23b2e`],[`#f2f0ea`,`#2f6fb0`],[`#e7c64a`,`#2b2b2b`],[`#2f8f57`,`#f2f0ea`]],o=Math.atan2(t.dy,t.dx);for(let s=-3;s<=3&&B<4;s++)for(let c of[1,-1]){if(B>=4)break;let l=c*(8+Math.abs(s)*4.2),u=[e[0]-t.dy*l,e[1]+t.dx*l];if(x(u)||n(u))continue;let d=[[-7,-2,0],[7,-2,0],[7,2,0],[-7,2,0]].map(([e,n])=>[u[0]+t.dx*e-t.dy*n,u[1]+t.dy*e+t.dx*n,X.area]);i.quad(d,[0,0,1],Y.concrete,d.map(e=>[e[0],e[1],0]));let[f,p]=r[B%r.length];a.model(je(f,p),u[0],u[1],X.area,o),B++}}let re=/* @__PURE__ */ new Map;for(let e of T){let t=He(e.l);for(let n=0;n<=t;n+=6){let t=Z(e.l,n).p;m(re,t[0],t[1],t)}}if(y.length){let[e,n,r,i]=[1/0,1/0,-1/0,-1/0];for(let t of y)[e,n,r,i]=[Math.min(e,t[0]),Math.min(n,t[1]),Math.max(r,t[0]),Math.max(i,t[1])];e=Math.floor((e-60)/25)*25,n=Math.floor((n-60)/25)*25;let a=Math.ceil((r+60-e)/25)+1,o=Math.ceil((i+60-n)/25)+1,s=new Float32Array(a*o),c=new Float32Array(a*o);for(let t=0;t<o;t++)for(let r=0;r<a;r++){let i=[e+r*25,n+t*25],o=1/0;h(v,i,e=>{o=Math.min(o,Math.hypot(e[0]-i[0],e[1]-i[1]))});let l=1/0;h(re,i,e=>{l=Math.min(l,Math.hypot(e[0]-i[0],e[1]-i[1]))}),o>60&&l>30||(s[t*a+r]=Math.max(1-ze(22,42,o),1-ze(9,19,l)),c[t*a+r]=S(i))}for(let r=0;r+1<o;r++)for(let i=0;i+1<a;i++){let o=[r*a+i,r*a+i+1,(r+1)*a+i+1,(r+1)*a+i];if(Math.max(...o.map(e=>s[e]))<.12)continue;let l=[[i,r],[i+1,r],[i+1,r+1],[i,r+1]].map(([t,r])=>[e+t*25,n+r*25,0]);t.quad(l,[0,0,1],Y.lot,o.map(e=>[c[e],s[e],0]))}}for(let e of u?.rios??[]){let t=[];for(let n=0;n+1<e.length;n+=2)t.push([e[n]/10,e[n+1]/10]);let n=Ve(t);n.pts.length<2||Q(r,n,-22,22,.035,Y.riverBand,(e,t)=>[e,t,22])}for(let e of u?.agua??[]){let t=e.map(e=>Qe(e)).filter(e=>e.length>=3);if(!t.length)continue;let r=t.flat(),[a,o]=[0,0];for(let e of r)[a,o]=[a+e[0]/r.length,o+e[1]/r.length];let[s,c,l]=[0,0,0];for(let e of r)s+=(e[0]-a)**2,c+=(e[0]-a)*(e[1]-o),l+=(e[1]-o)**2;let u=.5*Math.atan2(2*c,s-l),d=[],f=0;t.forEach((e,t)=>{t>0&&d.push(f),f+=e.length});for(let e of n(r.flat(),d,2)){let t=r[e];i.vertex([t[0],t[1],.04],[0,0,1],Y.river,[Math.cos(u),Math.sin(u),0])}}{let e=T.filter(e=>e.berma&&e.paved),t=/* @__PURE__ */ new Map;for(let n of e){let r=He(n.l),a=[],o=()=>{if(a.length>=2){let e=Ve(a.map(e=>e.p)),t=a.reduce((e,t)=>e+t.w,0)/a.length;Q(i,e,-t/2,t/2,X.curb-.02,Y.grass,(e,t)=>[e,Math.abs(t),0]);for(let n of[1,-1])Ge(i,e,n*t/2,X.asphalt,X.curb,Y.curb,0);let n=He(e);for(let r=8;r<n-8;r+=9){let{p:n}=Z(e,r);if(Math.hypot(n[0]-f[0],n[1]-f[1])<130||t<2)continue;let i=_e(U(`berma${Math.round(n[0])}_${Math.round(n[1])}`));Math.round(r/9)%2==0?(l.push(n[0],n[1],7+i()*3,Math.min(2.4,t/2+.6),i(),0),m(C,n[0],n[1],n)):w(n,3+i(),Math.min(1.5+i()*.4,t/2+.2),i())}}a=[]};for(let i=2;i<r-2;i+=5){let r=Z(n.l,i),s=null;for(let t of e)if(t!==n)for(let e=0;e+1<t.l.pts.length;e++){let n=t.l.pts[e],i=t.l.pts[e+1],a=i[0]-n[0],o=i[1]-n[1],c=Math.hypot(a,o)||1;if(Math.abs(a/c*r.dx+o/c*r.dy)<.9)continue;let l=Math.max(0,Math.min(1,((r.p[0]-n[0])*a+(r.p[1]-n[1])*o)/(c*c))),u=[n[0]+a*l,n[1]+o*l],d=Math.hypot(u[0]-r.p[0],u[1]-r.p[1]);d<28&&(!s||d<s.dist)&&(s={q:u,dist:d,hw:t.hw})}let c=s?s.dist-n.hw-s.hw-.4:0,l=s?[(r.p[0]+s.q[0])/2,(r.p[1]+s.q[1])/2]:null;!s||!l||c<1.5||h(t,l,e=>Math.hypot(e[0]-l[0],e[1]-l[1])<3)?o():(m(t,l[0],l[1],l),a.push({p:l,w:Math.min(c,8)}))}o()}}{let t=u?.especiales??{},n=t=>{let n=e.edificios.ids.indexOf(t),r=e.edificios.geometrias[n]?.[0]?.[0];if(!r)return null;let i=[];for(let e=0;e+1<r.length;e+=2)i.push([r[e]/10,r[e+1]/10]);return i.length>=3?{ring:i,floors:e.edificios.pisos[n]??1}:null},r=e=>[{m:e.at(e.u0,(e.v0+e.v1)/2),n:[-e.ax,-e.ay],short:!0},{m:e.at(e.u1,(e.v0+e.v1)/2),n:[e.ax,e.ay],short:!0},{m:e.at((e.u0+e.u1)/2,e.v0),n:[e.ay,-e.ax],short:!1},{m:e.at((e.u0+e.u1)/2,e.v1),n:[-e.ay,e.ax],short:!1}],i=(e,t)=>Math.hypot(e[0]-t[0],e[1]-t[1]),o=Pe();for(let e of t.iglesia??[]){let t=n(e);if(!t)continue;let r=ve(t.ring),i=Math.atan2(r.ay,r.ax),s=r.at((r.u0+r.u1)/2,(r.v0+r.v1)/2),c=f[0]-s[0],l=f[1]-s[1],u=c*r.ax+l*r.ay,d=-c*r.ay+l*r.ax,p=Math.abs(u)>=Math.abs(d),m=p?r.v1-r.v0:r.u1-r.u0,h=Math.min(4.2,Math.max(2.8,Math.min(m,22)*.24)),g=p?u>0?r.u1:r.u0:d>0?r.v1:r.v0,_=p?u>0?-1:1:d>0?-1:1,v=p?r.v0:r.u0,y=p?r.v1:r.u1,b=(v+y)/2,x=Math.min((y-v)/2,9),S=(e,t)=>p?r.at(e,t):r.at(t,e);for(let e of[b-x+h/2,b+x-h/2]){let t=S(g+_*h/2,e),n=`#f0b323`,r=`#f3f1ea`;a.box(t[0],t[1],i,h,h,0,13.6,n),a.box(t[0],t[1],i,h+.3,h+.3,0,.7,r),a.box(t[0],t[1],i,h+.3,h+.3,8.6,9,r),a.box(t[0],t[1],i,h+.3,h+.3,13.6,14,r),a.box(t[0],t[1],i,h-.2,h-.2,14,17,n),a.box(t[0],t[1],i,h-.16,h*.42,14.5,16.6,`#3a2f26`),a.box(t[0],t[1],i,h*.42,h-.16,14.5,16.6,`#3a2f26`),a.model(o,t[0],t[1],17,i,h/3.4)}let C=S(g-_*.05,b),w=p?i:i+Math.PI/2;a.box(C[0],C[1],w,.2,2.6,0,3.6,`#6b3a22`),a.box(C[0],C[1],w,.24,3.2,3.6,4.1,`#f3f1ea`)}let s=Fe();for(let e of t.comisaria??[]){let t=n(e);if(!t)continue;let o=r(ve(t.ring)).sort((e,t)=>i(e.m,f)-i(t.m,f))[0],c=[o.m[0]+o.n[0]*1.4,o.m[1]+o.n[1]*1.4];a.model(s,c[0],c[1],X.curb,Math.atan2(o.n[1],o.n[0])+Math.PI/2)}for(let e of t.municipalidad??[]){let t=n(e);if(!t)continue;let o=r(ve(t.ring)).sort((e,t)=>i(e.m,f)-i(t.m,f))[0],c=[o.m[0]+o.n[0]*2.6,o.m[1]+o.n[1]*2.6];a.model(s,c[0],c[1],X.curb,Math.atan2(o.n[1],o.n[0])+Math.PI/2);let l=Math.max(t.floors,5)*2.75+.3,u=[o.m[0]-o.n[0]*.4,o.m[1]-o.n[1]*.4],d=Math.atan2(o.n[1],o.n[0])+Math.PI/2;a.box(u[0],u[1],d,10,.35,l-.2,l+2.4,`#f6f6f2`),a.box(u[0],u[1],d,9,.4,l+.4,l+1.2,`#1f5fa8`),a.box(u[0],u[1],d,1.6,.45,l+1.3,l+2.3,`#2e8b3e`)}let c=Ie(),l=[...t.essalud??[],...t.hospital??[],...t.clinica??[]].map(e=>n(e)).filter(e=>e!==null&&Math.abs(K(e.ring))>=150).sort((e,t)=>Math.abs(K(t.ring))-Math.abs(K(e.ring))),d=[];for(let e of l){let t=q(e.ring);if(d.some(e=>i(e,t)<80))continue;d.push(t);let n=ve(e.ring),r=n.at((n.u0+n.u1)/2,(n.v0+n.v1)/2);a.model(c,r[0],r[1],Math.max(e.floors,2)*2.75+.3,Math.atan2(n.ay,n.ax))}}let ie=[t,r,i,a].map(e=>e.data),V=ie.reduce((e,t)=>e+t.length,0),H=new Float32Array(V),ae=[],oe=0;for(let e of ie){let t=Float32Array.from(e),n=new fe(10);for(let e=0;e+30<=t.length;e+=30){let[r,i,a,o,s]=[1/0,1/0,-1/0,-1/0,0];for(let n=e;n<e+30;n+=10)r=Math.min(r,t[n]),i=Math.min(i,t[n+1]),a=Math.max(a,t[n]),o=Math.max(o,t[n+1]),s=Math.max(s,t[n+2]);n.add(e,e+30,r,i,a,o,s)}let{data:r,table:i}=n.finish(t,e=>new Float32Array(e),oe/10);H.set(r,oe),ae.push(i),oe+=r.length}let se=[],ce=[];for(let e of o){ce.push(se.length/2,e.pts.length,e.weight,e.z,e.half,e.kind);for(let t of e.pts)se.push(t[0],t[1])}return{vertices:H,tables:ae,walks:{points:new Float32Array(se),index:new Float32Array(ce)},trees:new Float32Array(c),palms:new Float32Array(l),stats:{calles:T.length,pavimentadas:T.filter(e=>e.paved).length,conVereda:T.filter(e=>e.walk).length,bancas:F,pare:O,puestos:z,buses:B,arbolesNuevos:c.length/6,recorridos:o.length}}}let $=null,et=self;function tt(e){if(!$)return;let t=new Set(e),n=xe($,t),r=we($,t);et.postMessage({type:`buildings`,ids:$.edificios.ids,...n,power:r},[n.vertices.buffer,n.indices.buffer,n.chunks.buffer,n.skirtVertices.buffer,n.skirtIndices.buffer,n.skirtChunks.buffer,n.tanks.buffer,n.rebars.buffer,n.works.buffer,r.poles.buffer,r.lamps.buffer,r.trafos.buffer,r.lines.buffer])}et.onmessage=async e=>{let t=e.data;try{if(t.type===`load`){let e=performance.now(),n=await fetch(t.url,{credentials:`same-origin`});if(!n.ok)throw Error(`HTTP ${n.status}`);$=await n.json();let r=performance.now();tt(t.hidden);let i=Se($),a=i.trees.slice(),o=i.palms.slice(),s=pe(i.trees,6),c=pe(i.palms,6),l=Ce($);et.postMessage({type:`scene`,trees:s.data,treeChunks:s.table,palms:c.data,palmChunks:c.table,roads:l,fuentes:$.fuentes??{},ms:{descarga:r-e,armado:performance.now()-r}},[s.data.buffer,s.table.buffer,c.data.buffer,c.table.buffer,l.points.buffer,l.edgeStart.buffer,l.edgeCount.buffer,l.edgeA.buffer,l.edgeB.buffer,l.edgeCode.buffer,l.adjStart.buffer,l.adj.buffer]);let u=$e($),d=new Float32Array(a.length+u.trees.length);d.set(a,0),d.set(u.trees,a.length);let f=pe(d,6),p=new Float32Array(o.length+u.palms.length);p.set(o,0),p.set(u.palms,o.length);let m=pe(p,6);et.postMessage({type:`ground`,vertices:u.vertices,tables:u.tables,walks:u.walks,trees:f.data,treeChunks:f.table,palms:m.data,palmChunks:m.table,stats:u.stats},[u.vertices.buffer,...u.tables.map(e=>e.buffer),u.walks.points.buffer,u.walks.index.buffer,f.data.buffer,f.table.buffer,m.data.buffer,m.table.buffer])}else t.type===`hide`&&tt(t.hidden)}catch(e){et.postMessage({type:`error`,message:e instanceof Error?e.message:String(e)})}}})();", tt = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", et], { type: "text/javascript;charset=utf-8" });
function nt(e) {
	let t;
	try {
		if (t = tt && (self.URL || self.webkitURL).createObjectURL(tt), !t) throw "";
		let n = new Worker(t, { name: e?.name });
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(et), { name: e?.name });
	}
}
// src/mapa/ciudad/city-layer.ts
var rt = "bm-ciudad-3d", it = 2 * Math.PI * 6371008.8, at = (e) => (180 + e) / 360, ot = (e) => (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + e * Math.PI / 360))) / 360, st = 0, ct = 0, Y = 1, X = [
	Y,
	0,
	0,
	0,
	0,
	-Y,
	0,
	0,
	0,
	0,
	Y,
	0,
	st,
	ct,
	0,
	1
];
function lt([e, t]) {
	st = at(e), ct = ot(t), Y = 1 / (it * Math.cos(t * Math.PI / 180)), X[0] = Y, X[5] = -Y, X[10] = Y, X[12] = st, X[13] = ct;
}
var ut = (e, t) => [(at(e) - st) / Y, (ct - ot(t)) / Y];
function dt(e, t) {
	let n = /* @__PURE__ */ new Float64Array(16);
	for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
		let a = 0;
		for (let n = 0; n < 4; n++) a += e[n * 4 + i] * t[r * 4 + n];
		n[r * 4 + i] = a;
	}
	return n;
}
function ft(e) {
	let t = Array.from(e), n = /* @__PURE__ */ new Float64Array(16), [r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v] = t, y = r * c - i * s, b = r * l - a * s, x = r * u - o * s, S = i * l - a * c, C = i * u - o * c, w = a * u - o * l, T = d * g - f * h, E = d * _ - p * h, D = d * v - m * h, O = f * _ - p * g, k = f * v - m * g, A = p * v - m * _, j = y * A - b * k + x * O + S * D - C * E + w * T;
	return j ? (j = 1 / j, n[0] = (c * A - l * k + u * O) * j, n[1] = (a * k - i * A - o * O) * j, n[2] = (g * w - _ * C + v * S) * j, n[3] = (p * C - f * w - m * S) * j, n[4] = (l * D - s * A - u * E) * j, n[5] = (r * A - a * D + o * E) * j, n[6] = (_ * x - h * w - v * b) * j, n[7] = (d * w - p * x + m * b) * j, n[8] = (s * k - c * D + u * T) * j, n[9] = (i * D - r * k - o * T) * j, n[10] = (h * C - g * x + v * y) * j, n[11] = (f * x - d * C - m * y) * j, n[12] = (c * E - s * O - l * T) * j, n[13] = (r * O - i * E + a * T) * j, n[14] = (g * b - h * S - _ * y) * j, n[15] = (d * S - f * b + p * y) * j, n) : null;
}
function pt(e, t, n, r, i = 1) {
	return [
		0,
		1,
		2,
		3
	].map((a) => e[a] * t + e[4 + a] * n + e[8 + a] * r + e[12 + a] * i);
}
function mt(e, t, n) {
	let r = e[0] - t[0], i = e[1] - t[1], a = e[2] - t[2], o = Math.hypot(r, i, a);
	r /= o, i /= o, a /= o;
	let s = n[1] * a - n[2] * i, c = n[2] * r - n[0] * a, l = n[0] * i - n[1] * r;
	o = Math.hypot(s, c, l), s /= o, c /= o, l /= o;
	let u = i * l - a * c, d = a * s - r * l, f = r * c - i * s;
	return new Float64Array([
		s,
		u,
		r,
		0,
		c,
		d,
		i,
		0,
		l,
		f,
		a,
		0,
		-(s * e[0] + c * e[1] + l * e[2]),
		-(u * e[0] + d * e[1] + f * e[2]),
		-(r * e[0] + i * e[1] + a * e[2]),
		1
	]);
}
function ht(e, t, n) {
	return new Float64Array([
		1 / e,
		0,
		0,
		0,
		0,
		1 / e,
		0,
		0,
		0,
		0,
		-2 / (n - t),
		0,
		0,
		0,
		-(n + t) / (n - t),
		1
	]);
}
function gt(e, t, n, r, i = Infinity) {
	let a = [], o = [];
	if (!e) return {
		near: a,
		far: o
	};
	for (let s = 0; s + 7 <= e.length; s += 7) {
		let c = e[s + 6];
		if (!c) continue;
		let [l, u, d, f, p] = [
			e[s],
			e[s + 1],
			e[s + 2],
			e[s + 3],
			e[s + 4]
		], m = 0;
		if (n && (m = Math.hypot(Math.max(l - n[0], 0, n[0] - d), Math.max(u - n[1], 0, n[1] - f)), m > r)) continue;
		let [h, g, _, v, y] = [
			0,
			0,
			0,
			0,
			0
		];
		for (let e = 0; e < 8; e++) {
			let n = e & 1 ? d : l, r = e & 2 ? f : u, i = e & 4 ? p : 0, a = t[0] * n + t[4] * r + t[8] * i + t[12], o = t[1] * n + t[5] * r + t[9] * i + t[13], s = t[3] * n + t[7] * r + t[11] * i + t[15];
			s <= 0 && y++, a < -s && h++, a > s && g++, o < -s && _++, o > s && v++;
		}
		if (y === 8 || !y && (h === 8 || g === 8 || _ === 8 || v === 8)) continue;
		let b = m > i ? o : a, x = e[s + 5], S = b.length;
		S && b[S - 2] + b[S - 1] === x ? b[S - 1] = b[S - 1] + c : b.push(x, c);
	}
	return {
		near: a,
		far: o
	};
}
var _t = 295 * Math.PI / 180, vt = (() => {
	let e = [
		Math.sin(_t) * .74,
		Math.cos(_t) * .74,
		.67
	], t = Math.hypot(...e);
	return [
		e[0] / t,
		e[1] / t,
		e[2] / t
	];
})(), yt = class {
	id = rt;
	type = "custom";
	renderingMode = "3d";
	map;
	gl;
	worker;
	programs = /* @__PURE__ */ new Map();
	building;
	skirt;
	chunks = {};
	crowd;
	shadowKey = "";
	dirty = !0;
	meshes = {};
	ground;
	surface;
	shadow;
	pickTarget;
	lightMatrix = /* @__PURE__ */ new Float32Array(16);
	shadowReady = !1;
	ids = [];
	index = /* @__PURE__ */ new Map();
	selected = -1;
	hideSimulated = !1;
	theme = {
		night: 0,
		saturation: 1,
		selection: "#0b66f5",
		fog: "#e8f2f5"
	};
	riseStart = performance.now() - 5e3;
	last = performance.now();
	traffic;
	pending = [];
	hidden = [];
	loaded = !1;
	stats = {};
	animTimer = 0;
	onStats;
	onError;
	constructor(e) {
		lt(e), this.worker = new nt(), this.worker.onmessage = (e) => {
			try {
				this.receive(e.data);
			} catch (e) {
				console.error("Ciudad 3D:", e), this.onError?.(String(e));
			}
		}, this.worker.onerror = (e) => {
			console.error("Ciudad 3D (worker):", e.message), this.onError?.(e.message);
		};
	}
	load(e) {
		this.loaded || (this.loaded = !0, this.worker.postMessage({
			type: "load",
			url: new URL(e, location.href).href,
			hidden: this.hidden
		}));
	}
	setHidden(e) {
		let t = e.length === this.hidden.length && e.every((e, t) => e === this.hidden[t]);
		this.hidden = e, !t && this.ids.length && this.worker.postMessage({
			type: "hide",
			hidden: e
		});
	}
	uploads = [];
	flush(e) {
		this.uploads.length && (this.dirty = !0);
		for (let e of this.uploads.splice(0)) e();
		e.bindVertexArray(null);
	}
	receive(e) {
		if (e.type === "error") this.loaded = !1, this.onError?.(String(e.message));
		else {
			if (e.type === "buildings") {
				let t = e.ids;
				this.uploads.push(() => {
					let n = this.gl;
					this.ids = t, this.index = new Map(t.map((e, t) => [e, t]));
					let r = this.building;
					n.bindVertexArray(r.vao), n.bindBuffer(n.ARRAY_BUFFER, r.vbo), n.bufferData(n.ARRAY_BUFFER, e.vertices, n.STATIC_DRAW), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, r.ibo), n.bufferData(n.ELEMENT_ARRAY_BUFFER, e.indices, n.STATIC_DRAW), r.count = e.indices.length, r.chunks = e.chunks;
					let i = this.skirt;
					n.bindVertexArray(i.vao), n.bindBuffer(n.ARRAY_BUFFER, i.vbo), n.bufferData(n.ARRAY_BUFFER, e.skirtVertices, n.STATIC_DRAW), n.bindBuffer(n.ELEMENT_ARRAY_BUFFER, i.ibo), n.bufferData(n.ELEMENT_ARRAY_BUFFER, e.skirtIndices, n.STATIC_DRAW), i.chunks = e.skirtChunks, n.bindVertexArray(null), this.setInstances("tank", e.tanks), this.setInstances("rebar", e.rebars), this.setInstances("works", e.works);
					let a = e.power;
					this.setInstances("pole", a.poles), this.setInstances("lamp", a.lamps), this.setInstances("glow", a.lamps), this.setInstances("trafo", a.trafos);
					let o = this.meshes.wires;
					n.bindBuffer(n.ARRAY_BUFFER, o.vbo), n.bufferData(n.ARRAY_BUFFER, a.lines, n.STATIC_DRAW), o.vertexCount = a.lines.length / 10, this.setInstances("wires", new Float32Array([
						0,
						0,
						0,
						1,
						0,
						0
					]));
				}), this.ids = t, this.index = new Map(t.map((e, t) => [e, t])), this.stats.edificios = e.shown;
			} else e.type === "scene" ? (this.uploads.push(() => {
				this.setInstances("tree", e.trees, 6), this.setInstances("palm", e.palms, 6), this.chunks.tree = e.treeChunks, this.chunks.palm = e.palmChunks;
			}), this.traffic = new $e(e.roads), this.stats.arboles = (e.trees.length + e.palms.length) / 6, this.stats.palmas = e.palms.length, this.stats.vehiculos = this.traffic.buffers.reduce((e, t) => e + t.length / 6, 0), this.stats.ms = e.ms, this.onStats?.(this.stats)) : e.type === "ground" && (this.uploads.push(() => {
				let t = this.gl, n = this.surface;
				t.bindBuffer(t.ARRAY_BUFFER, n.vbo), t.bufferData(t.ARRAY_BUFFER, e.vertices, t.STATIC_DRAW), n.tables = e.tables, this.setInstances("tree", e.trees, 6), this.chunks.tree = e.treeChunks, e.palms && (this.setInstances("palm", e.palms, 6), this.chunks.palm = e.palmChunks);
			}), e.palms && (this.stats.palmas = e.palms.length), this.crowd = new ve(e.walks), this.stats.arboles = (e.trees.length + (this.stats.palmas ?? 0)) / 6, this.onStats?.(this.stats));
			this.map?.triggerRepaint();
		}
	}
	setInstances(e, t, n = 6) {
		let r = this.gl, i = this.meshes[e];
		r.bindBuffer(r.ARRAY_BUFFER, i.instances), r.bufferData(r.ARRAY_BUFFER, t, r.DYNAMIC_DRAW), i.count = t.length / n;
		let a = this.meshes[`blob_${e}`];
		a && (a.count = i.count);
	}
	drawRanges(e, t, n) {
		if (!t.length) return;
		let r = this.gl;
		r.bindVertexArray(e.vao), r.bindBuffer(r.ARRAY_BUFFER, e.instances);
		let i = n * 4;
		for (let n = 0; n < t.length; n += 2) {
			let a = t[n] * i;
			r.vertexAttribPointer(J.ia, 4, r.FLOAT, !1, i, a), r.vertexAttribPointer(J.ib, 2, r.FLOAT, !1, i, a + 16), r.drawArraysInstanced(r.TRIANGLES, 0, e.vertexCount, t[n + 1]);
		}
		r.vertexAttribPointer(J.ia, 4, r.FLOAT, !1, i, 0), r.vertexAttribPointer(J.ib, 2, r.FLOAT, !1, i, 16);
	}
	compile(e, t) {
		let n = this.gl, { vertex: r, fragment: i } = Xe(e, t), a = n.createProgram();
		for (let [o, s] of [[n.VERTEX_SHADER, r], [n.FRAGMENT_SHADER, i]]) {
			let r = n.createShader(o);
			if (n.shaderSource(r, s), n.compileShader(r), !n.getShaderParameter(r, n.COMPILE_STATUS)) throw Error(`Shader ${e}/${t}: ${n.getShaderInfoLog(r)}`);
			n.attachShader(a, r);
		}
		if (n.linkProgram(a), !n.getProgramParameter(a, n.LINK_STATUS)) throw Error(`Programa ${e}/${t}: ${n.getProgramInfoLog(a)}`);
		this.programs.set(`${e}/${t}`, {
			program: a,
			uniforms: /* @__PURE__ */ new Map()
		});
	}
	use(e) {
		let t = this.programs.get(e);
		this.gl.useProgram(t.program);
		let n = this.gl, r = (e) => (t.uniforms.has(e) || t.uniforms.set(e, n.getUniformLocation(t.program, e)), t.uniforms.get(e));
		return {
			f: (e, ...t) => {
				let i = r(e);
				i && (t.length === 1 ? n.uniform1f(i, t[0]) : t.length === 2 ? n.uniform2f(i, t[0], t[1]) : t.length === 3 ? n.uniform3f(i, t[0], t[1], t[2]) : n.uniform4f(i, t[0], t[1], t[2], t[3]));
			},
			v3: (e, t) => {
				let i = r(e);
				i && n.uniform3fv(i, t);
			},
			m: (e, t) => {
				let i = r(e);
				i && n.uniformMatrix4fv(i, !1, t);
			},
			i: (e, t) => {
				let i = r(e);
				i && n.uniform1i(i, t);
			}
		};
	}
	instanced(e, t, n) {
		let r = this.gl, i = r.createVertexArray();
		r.bindVertexArray(i);
		let a = r.createBuffer();
		r.bindBuffer(r.ARRAY_BUFFER, a), r.bufferData(r.ARRAY_BUFFER, e, r.STATIC_DRAW), r.enableVertexAttribArray(J.pos), r.vertexAttribPointer(J.pos, 3, r.FLOAT, !1, 40, 0), r.enableVertexAttribArray(J.normal), r.vertexAttribPointer(J.normal, 3, r.FLOAT, !1, 40, 12), r.enableVertexAttribArray(J.color), r.vertexAttribPointer(J.color, 4, r.FLOAT, !1, 40, 24);
		let o = n ?? r.createBuffer();
		return r.bindBuffer(r.ARRAY_BUFFER, o), n || r.bufferData(r.ARRAY_BUFFER, /* @__PURE__ */ new Float32Array(), r.DYNAMIC_DRAW), r.enableVertexAttribArray(J.ia), r.vertexAttribPointer(J.ia, 4, r.FLOAT, !1, t * 4, 0), r.vertexAttribDivisor(J.ia, 1), r.enableVertexAttribArray(J.ib), r.vertexAttribPointer(J.ib, 2, r.FLOAT, !1, t * 4, 16), r.vertexAttribDivisor(J.ib, 1), r.bindVertexArray(null), {
			vao: i,
			vbo: a,
			instances: o,
			vertexCount: e.length / 10,
			count: 0
		};
	}
	onAdd(e, t) {
		this.map = e, this.gl = t;
	}
	initialized = !1;
	init(e) {
		if (this.initialized) return;
		this.initialized = !0;
		for (let e of [
			"building",
			"mesh",
			"tree",
			"ground",
			"glow",
			"surface",
			"skirt"
		]) this.compile(e, "main");
		for (let e of [
			"building",
			"mesh",
			"tree",
			"surface"
		]) this.compile(e, "shadow");
		this.compile("building", "pick");
		let t = e.createVertexArray();
		e.bindVertexArray(t);
		let n = e.createBuffer(), r = e.createBuffer();
		e.bindBuffer(e.ARRAY_BUFFER, n), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, r);
		let i = (t, n, r) => {
			e.enableVertexAttribArray(t), e.vertexAttribPointer(t, n, e.FLOAT, !1, 56, r * 4);
		};
		i(J.pos, 3, 0), i(J.normal, 3, 3), i(J.uv, 2, 6), i(J.info, 4, 8), i(J.style, 1, 12), i(J.id, 1, 13), e.bindVertexArray(null), this.building = {
			vao: t,
			vbo: n,
			ibo: r,
			count: 0
		}, this.meshes = {
			tree: this.instanced(we(), 6),
			palm: this.instanced(Te(), 6),
			tank: this.instanced(Oe(), 6),
			rebar: this.instanced(ke(), 6),
			works: this.instanced(Me(), 6),
			mototaxi: this.instanced(Ee(), 6),
			moto: this.instanced(q(), 6),
			auto: this.instanced(De(), 6),
			pole: this.instanced(Ae("pole"), 6),
			lamp: this.instanced(Ae("lamp"), 6),
			trafo: this.instanced(Ae("trafo"), 6),
			glow: this.instanced(je(), 6),
			wires: this.instanced(/* @__PURE__ */ new Float32Array(), 6),
			person: this.instanced(Ce(), 6)
		}, this.meshes.treeLow = this.instanced(xe(), 6, this.meshes.tree.instances), this.meshes.palmLow = this.instanced(Se(), 6, this.meshes.palm.instances);
		for (let e of [
			"mototaxi",
			"moto",
			"auto",
			"person"
		]) this.meshes[`blob_${e}`] = this.instanced(je(), 6, this.meshes[e].instances);
		{
			let t = e.createVertexArray();
			e.bindVertexArray(t);
			let n = e.createBuffer();
			e.bindBuffer(e.ARRAY_BUFFER, n), e.enableVertexAttribArray(J.pos), e.vertexAttribPointer(J.pos, 3, e.FLOAT, !1, 40, 0), e.enableVertexAttribArray(J.normal), e.vertexAttribPointer(J.normal, 3, e.FLOAT, !1, 40, 12), e.enableVertexAttribArray(J.color), e.vertexAttribPointer(J.color, 4, e.FLOAT, !1, 40, 24), e.bindVertexArray(null), this.surface = {
				vao: t,
				vbo: n,
				tables: []
			};
		}
		{
			let t = e.createVertexArray();
			e.bindVertexArray(t);
			let n = e.createBuffer(), r = e.createBuffer();
			e.bindBuffer(e.ARRAY_BUFFER, n), e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, r), e.enableVertexAttribArray(J.pos), e.vertexAttribPointer(J.pos, 3, e.FLOAT, !1, 12, 0), e.bindVertexArray(null), this.skirt = {
				vao: t,
				vbo: n,
				ibo: r
			};
		}
		this.ground = e.createVertexArray(), e.bindVertexArray(this.ground);
		let a = e.createBuffer();
		e.bindBuffer(e.ARRAY_BUFFER, a), e.bufferData(e.ARRAY_BUFFER, new Float32Array([
			-1,
			-1,
			0,
			1,
			-1,
			0,
			1,
			1,
			0,
			-1,
			-1,
			0,
			1,
			1,
			0,
			-1,
			1,
			0
		]), e.STATIC_DRAW), e.enableVertexAttribArray(J.pos), e.vertexAttribPointer(J.pos, 3, e.FLOAT, !1, 12, 0), e.bindVertexArray(null);
		let o = navigator.maxTouchPoints > 0, s = Math.min(o ? 2048 : 4096, e.getParameter(e.MAX_TEXTURE_SIZE)), c = e.createTexture();
		e.bindTexture(e.TEXTURE_2D, c), e.texImage2D(e.TEXTURE_2D, 0, e.DEPTH_COMPONENT24, s, s, 0, e.DEPTH_COMPONENT, e.UNSIGNED_INT, null), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_COMPARE_MODE, e.COMPARE_REF_TO_TEXTURE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_COMPARE_FUNC, e.LEQUAL);
		let l = e.createFramebuffer(), u = e.getParameter(e.FRAMEBUFFER_BINDING);
		e.bindFramebuffer(e.FRAMEBUFFER, l), e.framebufferTexture2D(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.TEXTURE_2D, c, 0), e.drawBuffers([e.NONE]), e.readBuffer(e.NONE), e.bindFramebuffer(e.FRAMEBUFFER, u), e.bindTexture(e.TEXTURE_2D, null), this.shadow = {
			fbo: l,
			tex: c,
			size: s
		};
	}
	onRemove(e, t) {
		this.worker.terminate(), window.clearTimeout(this.animTimer);
		for (let e of this.programs.values()) t.deleteProgram(e.program);
		this.shadow && (t.deleteFramebuffer(this.shadow.fbo), t.deleteTexture(this.shadow.tex));
	}
	rise() {
		this.riseStart = performance.now(), this.map?.triggerRepaint();
	}
	setSelected(e) {
		this.selected = this.index.get(e) ?? -1, this.map?.triggerRepaint();
	}
	setHideSimulated(e) {
		this.hideSimulated = e, this.map?.triggerRepaint();
	}
	setTheme(e) {
		this.theme = e, this.map?.triggerRepaint();
	}
	pick(e, t) {
		return new Promise((n) => {
			if (!this.ids.length) return n(null);
			this.pending.push({
				x: e,
				y: t,
				resolve: n
			}), this.map?.triggerRepaint();
		});
	}
	frame(e) {
		let t = dt(e.defaultProjectionData.mainMatrix, X), n = ft(t), r = [
			0,
			0,
			1e3
		];
		if (n) {
			let e = pt(n, 0, 0, 1, 0);
			Math.abs(e[3]) > 1e-9 && (r = [
				e[0] / e[3],
				e[1] / e[3],
				e[2] / e[3]
			]);
		}
		let i = this.map.getCenter(), a = ut(i.lng, i.lat), o = Math.hypot(r[0] - a[0], r[1] - a[1], r[2]);
		return {
			matrix: new Float32Array(t),
			eye: r,
			center: a,
			dc: o
		};
	}
	prerender(e) {
		if (!this.map || (this.init(e), this.flush(e), !this.shadow || !this.building?.count)) return;
		let t = this.map.getZoom();
		if (t < 14.8) {
			this.shadowReady = !1;
			return;
		}
		let n = this.map.getCenter(), [r, i] = ut(n.lng, n.lat), a = Math.min(2400, Math.max(110, 260 * 2 ** (17 - t))), o = mt([
			r + vt[0] * 900,
			i + vt[1] * 900,
			vt[2] * 900
		], [
			r,
			i,
			0
		], [
			0,
			0,
			1
		]), s = dt(ht(a, 1, 1900), o), c = pt(s, 0, 0, 0), l = this.shadow.size / 2, u = Math.round(c[0] * l) / l - c[0], d = Math.round(c[1] * l) / l - c[1];
		s = dt(new Float64Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			u,
			d,
			0,
			1
		]), s), this.lightMatrix = new Float32Array(s);
		let f = Array.from(this.lightMatrix).join(","), p = performance.now() - this.riseStart < 1400;
		if (this.shadowReady && !this.dirty && !p && f === this.shadowKey) return;
		this.shadowKey = f, this.dirty = !1;
		let m = e.getParameter(e.FRAMEBUFFER_BINDING);
		e.bindFramebuffer(e.FRAMEBUFFER, this.shadow.fbo), e.viewport(0, 0, this.shadow.size, this.shadow.size), e.disable(e.SCISSOR_TEST), e.disable(e.STENCIL_TEST), e.disable(e.BLEND), e.enable(e.DEPTH_TEST), e.depthRange(0, 1), e.depthFunc(e.LEQUAL), e.depthMask(!0), e.colorMask(!1, !1, !1, !1), e.clearDepth(1), e.clear(e.DEPTH_BUFFER_BIT), e.enable(e.POLYGON_OFFSET_FILL), e.polygonOffset(2.5, 6), e.disable(e.CULL_FACE), this.draw(e, "shadow", this.lightMatrix), e.disable(e.POLYGON_OFFSET_FILL), e.colorMask(!0, !0, !0, !0), e.bindFramebuffer(e.FRAMEBUFFER, m), this.shadowReady = !0;
	}
	draw(e, t, n, r, i, a = 16) {
		let o = (performance.now() - this.riseStart) / 1e3, s = performance.now() / 1e3, c = t === "main", l = (e) => {
			e.m("u_matrix", n), e.f("u_rise", o), c && (e.m("u_light", this.lightMatrix), e.f("u_shadow_on", +!!this.shadowReady), e.i("u_shadow", 0), e.f("u_sun", ...vt), e.f("u_eye", ...r), e.f("u_night", this.theme.night), e.v3("u_fog_color", N(this.theme.fog)), e.f("u_fog", i[0], i[1]), e.f("u_saturation", this.theme.saturation));
		};
		c && this.shadow && (e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.shadow.tex));
		let u = c && r && i ? i[1] * 1.05 : Infinity, d = (e, t = Infinity) => gt(e, n, c && r ? r : null, u, t), f = (t) => {
			for (let n = 0; n < t.length; n += 2) e.drawElements(e.TRIANGLES, t[n + 1], e.UNSIGNED_INT, t[n] * 4);
		}, p = (t) => {
			for (let n = 0; n < t.length; n += 2) e.drawArrays(e.TRIANGLES, t[n], t[n + 1]);
		}, m = this.surface;
		if (m && m.tables.length === 4) {
			let [n, r, i, o] = m.tables, u = this.use(`surface/${t}`);
			l(u), u.f("u_time", s), c && (e.bindVertexArray(m.vao), e.depthMask(!1), p(d(n).near), p(d(r).near), e.depthMask(!0), p(d(i).near), this.skirt?.chunks && a >= 15 && (l(this.use("skirt/main")), e.disable(e.DEPTH_TEST), e.depthMask(!1), e.bindVertexArray(this.skirt.vao), f(d(this.skirt.chunks).near), e.enable(e.DEPTH_TEST), e.depthMask(!0), this.use(`surface/${t}`))), a >= 15 && (e.bindVertexArray(m.vao), p(d(o).near));
		}
		if (this.building?.count) {
			let n = this.use(`building/${t}`);
			l(n), c && (n.v3("u_facade", M.flatMap(N)), n.v3("u_roof", O.flatMap(N)), n.v3("u_sign", ee.flatMap(N)), n.f("u_selected", this.selected), n.v3("u_selection", N(this.theme.selection)), n.f("u_hide_simulated", +!!this.hideSimulated)), e.bindVertexArray(this.building.vao), this.building.chunks ? f(d(this.building.chunks).near) : e.drawElements(e.TRIANGLES, this.building.count, e.UNSIGNED_INT, 0);
		}
		let h = this.use(`mesh/${t}`);
		l(h), h.f("u_time", s), c && h.v3("u_palette", te.flatMap(N));
		let g = c && a >= 15 ? [
			"mototaxi",
			"moto",
			"auto"
		] : [], _ = c && a >= 16.3 ? ["person"] : [], v = a >= 15.5 ? [
			"pole",
			"lamp",
			"trafo"
		] : [];
		for (let t of [
			"tank",
			"rebar",
			"works",
			...v,
			...g,
			..._
		]) {
			let n = this.meshes[t];
			n.count && (e.bindVertexArray(n.vao), e.drawArraysInstanced(e.TRIANGLES, 0, n.vertexCount, n.count));
		}
		let y = this.meshes.wires;
		c && a >= 16 && y.count && y.vertexCount && (e.bindVertexArray(y.vao), e.drawArraysInstanced(e.LINES, 0, y.vertexCount, 1));
		let b = this.use(`tree/${t}`);
		l(b), b.f("u_time", s);
		let x = c && i ? i[0] * .95 : 0;
		for (let e of ["tree", "palm"]) {
			let t = this.meshes[e];
			if (!t.count) continue;
			b.f("u_palm", +(e === "palm"));
			let n = this.chunks[e];
			if (!n) continue;
			let { near: r, far: i } = d(n, x);
			c && this.drawRanges(t, r, 6), this.drawRanges(this.meshes[`${e}Low`], c ? i : r, 6);
		}
		if (c) {
			let t = this.use("glow/main");
			l(t), e.depthMask(!1);
			let n = this.meshes.glow;
			this.theme.night > 0 && n.count && a >= 15.5 && (t.f("u_dark", 0), t.f("u_blob", 7, 7, 0, 2.6), e.bindVertexArray(n.vao), e.drawArraysInstanced(e.TRIANGLES, 0, n.vertexCount, n.count)), t.f("u_dark", 1);
			for (let [n, r, i] of [
				[
					"mototaxi",
					1.6,
					.95
				],
				[
					"moto",
					1.05,
					.42
				],
				[
					"auto",
					2.5,
					1.15
				],
				[
					"person",
					.42,
					.42
				]
			]) {
				let a = this.meshes[`blob_${n}`];
				a.count && (g.includes(n) || _.includes(n)) && (t.f("u_blob", r, i, 0, 0), e.bindVertexArray(a.vao), e.drawArraysInstanced(e.TRIANGLES, 0, a.vertexCount, a.count));
			}
			e.depthMask(!0);
		}
		e.bindVertexArray(null);
	}
	render(e, t) {
		if (!this.map || (this.init(e), this.flush(e), !this.building)) return;
		let n = this.map.getZoom();
		if (n < 14.6) return;
		let r = performance.now(), i = Math.min(.1, (r - this.last) / 1e3);
		this.last = r;
		let { matrix: a, eye: o, dc: s } = this.frame(t), c = [s * 1.4, s * 4.6];
		if (this.traffic && n >= 15 && (this.traffic.update(i), [
			"mototaxi",
			"moto",
			"auto"
		].forEach((e, t) => {
			this.setInstances(e, this.traffic.buffers[t]);
		})), this.crowd && n >= 16.3) {
			let e = this.map.getCenter();
			this.crowd.follow(...ut(e.lng, e.lat)), this.crowd.update(i), this.setInstances("person", this.crowd.buffer);
		}
		if (e.disable(e.CULL_FACE), this.shadowReady && this.ground) {
			let t = this.map.getCenter(), [r, i] = ut(t.lng, t.lat), s = Math.min(2400, Math.max(110, 260 * 2 ** (17 - n))), l = this.use("ground/main");
			l.m("u_matrix", a), l.m("u_light", this.lightMatrix), l.f("u_shadow_on", 1), l.i("u_shadow", 0), l.f("u_eye", ...o), l.f("u_fog", c[0], c[1]), l.f("u_ground", r, i, s * 1.5), l.f("u_strength", .62 * (1 - .6 * this.theme.night)), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.shadow.tex), e.depthMask(!1), e.bindVertexArray(this.ground), e.drawArrays(e.TRIANGLES, 0, 6), e.depthMask(!0);
		}
		this.draw(e, "main", a, o, c, n), this.pending.length && this.runPicks(e, a), (this.traffic && n >= 15 || r - this.riseStart < 1300) && !document.hidden && (window.clearTimeout(this.animTimer), this.animTimer = window.setTimeout(() => this.map?.triggerRepaint(), 33));
	}
	runPicks(e, t) {
		let n = e.drawingBufferWidth, r = e.drawingBufferHeight;
		if (!this.pickTarget || this.pickTarget.w !== n || this.pickTarget.h !== r) {
			this.pickTarget && (e.deleteFramebuffer(this.pickTarget.fbo), e.deleteRenderbuffer(this.pickTarget.color), e.deleteRenderbuffer(this.pickTarget.depth));
			let t = e.createFramebuffer(), i = e.createRenderbuffer(), a = e.createRenderbuffer();
			e.bindRenderbuffer(e.RENDERBUFFER, i), e.renderbufferStorage(e.RENDERBUFFER, e.RGBA8, n, r), e.bindRenderbuffer(e.RENDERBUFFER, a), e.renderbufferStorage(e.RENDERBUFFER, e.DEPTH_COMPONENT24, n, r);
			let o = e.getParameter(e.FRAMEBUFFER_BINDING);
			e.bindFramebuffer(e.FRAMEBUFFER, t), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.RENDERBUFFER, i), e.framebufferRenderbuffer(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.RENDERBUFFER, a), e.bindFramebuffer(e.FRAMEBUFFER, o), this.pickTarget = {
				fbo: t,
				color: i,
				depth: a,
				w: n,
				h: r
			};
		}
		let i = e.getParameter(e.FRAMEBUFFER_BINDING), a = e.getParameter(e.VIEWPORT);
		e.bindFramebuffer(e.FRAMEBUFFER, this.pickTarget.fbo), e.viewport(0, 0, n, r), e.disable(e.BLEND), e.enable(e.DEPTH_TEST), e.depthFunc(e.LEQUAL), e.depthMask(!0), e.depthRange(0, 1);
		let o = n / this.map.getCanvas().clientWidth, s = /* @__PURE__ */ new Uint8Array(4);
		for (let n of this.pending.splice(0)) {
			let i = Math.floor(n.x * o), a = Math.floor(r - n.y * o - 1);
			e.enable(e.SCISSOR_TEST), e.scissor(i, a, 1, 1), e.clearColor(0, 0, 0, 0), e.clearDepth(1), e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT);
			let c = this.use("building/pick");
			c.m("u_matrix", t), c.f("u_rise", 10), e.bindVertexArray(this.building.vao), e.drawElements(e.TRIANGLES, this.building.count, e.UNSIGNED_INT, 0), e.readPixels(i, a, 1, 1, e.RGBA, e.UNSIGNED_BYTE, s), e.disable(e.SCISSOR_TEST);
			let l = s[0] + s[1] * 256 + s[2] * 65536 - 1;
			n.resolve(s[3] && l >= 0 ? this.ids[l] ?? null : null);
		}
		e.bindVertexArray(null), e.bindFramebuffer(e.FRAMEBUFFER, i), e.viewport(a[0], a[1], a[2], a[3]);
	}
}, Z = "overture", bt = (e, t, n) => [
	"interpolate",
	["exponential", 1.6],
	["zoom"],
	12,
	e,
	14,
	t,
	18,
	n
], Q = 20, xt = 2 ** 16 / 77892, St = [
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
], $ = (e) => [
	"match",
	["get", "clase"],
	...St.flatMap((t) => [[...t.clases], e(t)]),
	e(St[2])
], Ct = [
	"==",
	["get", "doble_calzada"],
	1
], wt = [
	"max",
	3,
	[
		"min",
		$((e) => e.metros),
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
], Tt = (e, t) => [
	"case",
	Ct,
	[
		"+",
		[
			"*",
			wt,
			xt * 2 ** (e - 16)
		],
		t
	],
	[
		"+",
		[
			"*",
			[
				"coalesce",
				["get", "ancho"],
				["get", "ancho_m"],
				$((e) => e.metros)
			],
			xt * 2 ** (e - 16)
		],
		t
	]
], Et = (e = 0) => [
	"interpolate",
	["exponential", 2],
	["zoom"],
	12,
	[
		"case",
		Ct,
		$((t) => t.z12 * .6 + e),
		$((t) => t.z12 + e)
	],
	14,
	[
		"case",
		Ct,
		$((t) => t.z14 * .6 + e),
		$((t) => t.z14 + e)
	],
	16,
	Tt(16, e),
	Q,
	Tt(Q, e)
], Dt = $((e) => e.rango), Ot = [
	"interpolate",
	["linear"],
	["zoom"],
	12,
	.5,
	16,
	1.4,
	Q,
	3
], kt = (e, t) => {
	let n = t * Math.PI / 180, r = (t) => {
		let r = e * xt * 2 ** (t - 16);
		return ["literal", [+(r * Math.sin(n)).toFixed(2), +(-r * Math.cos(n)).toFixed(2)]];
	};
	return [
		"interpolate",
		["exponential", 2],
		["zoom"],
		15,
		r(15),
		Q,
		r(Q)
	];
}, At = 295, jt = () => [
	"interpolate",
	["exponential", 2],
	["zoom"],
	14,
	[
		"*",
		[
			"coalesce",
			["get", "r"],
			3
		],
		2 ** 14 / 77892
	],
	Q,
	[
		"*",
		[
			"coalesce",
			["get", "r"],
			3
		],
		2 ** Q / 77892
	]
], Mt = [
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
], Nt = [
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
], Pt = (e) => e.techosColor ? ne() : Ft(e), Ft = (e) => [
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
], It = (e) => [
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
function Lt(e = "positron", t) {
	let n = F[e].palette, r = [
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
		name: `BAGUA MASTER · Overture · ${F[e].label}`,
		metadata: {
			"karto:base": "Overture Maps",
			"karto:referencia-visual": F[e].label
		},
		light: {
			anchor: "map",
			color: n.luz,
			intensity: .38,
			position: [
				1.6,
				At,
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
		glyphs: de(t),
		sources: {
			[Z]: {
				type: "vector",
				url: ue(t),
				attribution: fe(t)
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
				source: Z,
				"source-layer": "terreno",
				filter: [
					"==",
					["geometry-type"],
					"Polygon"
				],
				paint: { "fill-color": n.terreno }
			},
			{
				id: "bm-cobertura",
				type: "fill",
				source: Z,
				"source-layer": "cobertura",
				paint: {
					"fill-color": [
						"match",
						["get", "clase"],
						"forest",
						n.cobBosque,
						"crop",
						n.cobCultivo,
						"grass",
						n.cobPasto,
						"shrub",
						n.cobMatorral,
						"barren",
						n.cobDesnudo,
						["wetland", "mangrove"],
						n.cobHumedal,
						n.terreno
					],
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						13,
						[
							"match",
							["get", "clase"],
							"urban",
							0,
							.9
						],
						16,
						[
							"match",
							["get", "clase"],
							"urban",
							0,
							"forest",
							.6,
							.38
						]
					]
				}
			},
			{
				id: "bm-veredas",
				type: "fill",
				source: Z,
				"source-layer": "veredas",
				minzoom: 14,
				paint: {
					"fill-color": n.viaBorde,
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						14,
						0,
						15.5,
						1
					]
				}
			},
			{
				id: "bm-manzanas",
				type: "fill",
				source: Z,
				"source-layer": "manzanas",
				paint: {
					"fill-color": n.residencial,
					"fill-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						12,
						.5,
						15,
						1
					]
				}
			},
			{
				id: "bm-bermas",
				type: "fill",
				source: Z,
				"source-layer": "bermas",
				minzoom: 14,
				paint: { "fill-color": n.verde }
			},
			{
				id: "bm-equipamientos",
				type: "fill",
				source: Z,
				"source-layer": "equipamientos",
				paint: {
					"fill-color": [
						"match",
						["get", "clase"],
						[
							"school",
							"college",
							"university"
						],
						n.educacion,
						["hospital", "clinic"],
						n.salud,
						"cemetery",
						n.cementerio,
						[
							"stadium",
							"pitch",
							"sports_centre"
						],
						n.deporte,
						"park",
						n.verde,
						n.residencial
					],
					"fill-opacity": .9
				}
			},
			{
				id: "bm-usos",
				type: "fill",
				source: Z,
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
				source: Z,
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
				id: "bm-manzanas-borde",
				type: "line",
				source: Z,
				"source-layer": "manzanas",
				minzoom: 15.5,
				paint: {
					"line-color": n.edificioBorde,
					"line-opacity": .35,
					"line-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15.5,
						.4,
						19,
						1.2
					]
				}
			},
			{
				id: "bm-agua-area",
				type: "fill",
				source: Z,
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
				source: Z,
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
					"line-width": bt(1.5, 4, 14)
				}
			},
			{
				id: "bm-senderos",
				type: "line",
				source: Z,
				"source-layer": "red_vial",
				minzoom: 14,
				filter: Nt,
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
					"line-width": Et(),
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
				source: Z,
				"source-layer": "red_vial",
				filter: Mt,
				layout: {
					"line-cap": "round",
					"line-join": "round",
					"line-sort-key": Dt
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
					"line-gap-width": Et(),
					"line-width": Ot
				}
			},
			{
				id: "bm-vias",
				type: "line",
				source: Z,
				"source-layer": "red_vial",
				filter: Mt,
				layout: {
					"line-cap": "round",
					"line-join": "round",
					"line-sort-key": Dt
				},
				paint: {
					"line-color": r,
					"line-width": Et()
				}
			},
			{
				id: "bm-vias-eje",
				type: "line",
				source: Z,
				"source-layer": "red_vial",
				minzoom: 16,
				filter: [
					"all",
					[
						"match",
						["get", "clase"],
						[
							"trunk",
							"primary",
							"secondary"
						],
						!0,
						!1
					],
					[
						"!=",
						["get", "doble_calzada"],
						1
					]
				],
				layout: { "line-cap": "butt" },
				paint: {
					"line-color": [
						"match",
						["get", "clase"],
						["trunk", "primary"],
						n.ejeViaPrincipal,
						n.ejeVia
					],
					"line-width": [
						"interpolate",
						["exponential", 2],
						["zoom"],
						16,
						.7,
						20,
						3
					],
					"line-dasharray": [3, 3],
					"line-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						16,
						0,
						16.6,
						.9
					]
				}
			},
			{
				id: "bm-edificios-sombra",
				type: "fill",
				source: Z,
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
					"fill-translate": kt(1.1, 115),
					"fill-translate-anchor": "map"
				}
			},
			{
				id: "bm-edificios",
				type: "fill",
				source: Z,
				"source-layer": "edificios",
				minzoom: 13.5,
				paint: {
					"fill-color": Pt(n),
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
				source: Z,
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
					"fill-color": Pt(n),
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
					"fill-color": Pt(n),
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
				id: "bm-arboles-sombra",
				type: "circle",
				source: Z,
				"source-layer": "arboles",
				minzoom: 14.5,
				paint: {
					"circle-radius": jt(),
					"circle-color": n.arbolSombra,
					"circle-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						14.5,
						0,
						15.5,
						.35
					],
					"circle-translate": kt(1.6, 115),
					"circle-translate-anchor": "map",
					"circle-pitch-alignment": "map"
				}
			},
			{
				id: "bm-arboles",
				type: "circle",
				source: Z,
				"source-layer": "arboles",
				minzoom: 14.5,
				paint: {
					"circle-radius": jt(),
					"circle-color": [
						"interpolate",
						["linear"],
						[
							"coalesce",
							["get", "h"],
							8
						],
						4,
						n.arbol,
						20,
						n.arbolBorde
					],
					"circle-opacity": [
						"interpolate",
						["linear"],
						["zoom"],
						14.5,
						0,
						15.2,
						.92
					],
					"circle-stroke-color": n.arbolBorde,
					"circle-stroke-width": [
						"interpolate",
						["linear"],
						["zoom"],
						15,
						.3,
						19,
						1.2
					],
					"circle-pitch-alignment": "map"
				}
			},
			{
				id: "bm-conectores",
				type: "circle",
				source: Z,
				"source-layer": "conectores",
				minzoom: 17.5,
				paint: {
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						17.5,
						2.2,
						Q,
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
				source: Z,
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
					"fill-translate": kt(7, 115),
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
				source: Z,
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
				source: Z,
				"source-layer": "red_vial",
				filter: [
					"==",
					["get", "id"],
					""
				],
				layout: { "line-cap": "round" },
				paint: {
					"line-color": n.seleccion,
					"line-width": Et(4),
					"line-opacity": .55
				}
			},
			{
				id: "bm-agua-texto",
				type: "symbol",
				source: Z,
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
				source: Z,
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
				source: Z,
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
				source: Z,
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
				source: Z,
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
				source: Z,
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
					"circle-color": It(n),
					"circle-stroke-color": n.halo,
					"circle-stroke-width": 1.8
				}
			},
			{
				id: "bm-lugares-texto",
				type: "symbol",
				source: Z,
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
					"circle-color": It(n),
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
var Rt = [
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
		layer: "bm-equipamientos",
		tabla: "equipamiento"
	},
	{
		layer: "bm-usos",
		tabla: "uso_suelo"
	},
	{
		layer: "bm-manzanas",
		tabla: "manzana"
	},
	{
		layer: "bm-terreno",
		tabla: "terreno"
	}
], zt = null, Bt = (e) => ["!", [
	"in",
	["get", "id"],
	["literal", e]
]], Vt = ["bm-lugares-movidos", "bm-lugares"], Ht = [
	"bm-edificios-3d",
	"bm-alturas-3d",
	"bm-alturas-sombra",
	"bm-alturas-seleccion"
], Ut = {
	"2d": [0, 0],
	"2.5d": [58, 58],
	"3d": [0, 85]
};
function Wt(e, t) {
	let n = Rt.filter((t) => e.getLayer(t.layer)), r = e.queryRenderedFeatures(t, { layers: n.map((e) => e.layer) });
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
function Gt({ origen: e, seleccion: a, vista: o, tema: s, modo3d: c, alturas: l, mostrarSimuladas: u, complemento: d, correcciones: f, onSeleccion: p, onMapa: m, onFallo: h, onCiudad: g }) {
	let _ = r(null), y = r(null), b = r(null), x = r({
		onSeleccion: p,
		onMapa: m,
		onFallo: h,
		onCiudad: g
	}), S = r(!1), C = r(e), w = r(s), T = o !== "2d", E = !!e.ciudad.ciudad3d && c === "ciudad", D = T && E, [O, k] = i(!1), A = n(() => new Map((l?.features ?? []).map((e) => [String(e.properties?.id), e.properties])), [l]), j = r(A);
	return t(() => {
		x.current = {
			onSeleccion: p,
			onMapa: m,
			onFallo: h,
			onCiudad: g
		}, S.current = D, j.current = A;
	}, [
		p,
		m,
		h,
		g,
		D,
		A
	]), t(() => {
		let e = _.current;
		if (!e) return;
		let t = !1, n, r = new ResizeObserver(() => n?.resize());
		return r.observe(e), _e(L(C.current.datos)).then((r) => {
			if (t) return;
			let { ciudad: i } = C.current, [[a, o], [s, c]] = i.limites, l = zt?.ciudad === i.id ? zt : null;
			n = new r.Map({
				container: e,
				style: Lt(w.current, C.current),
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
			}), y.current = n, n.touchZoomRotate.disableRotation(), n.getCanvas().setAttribute("aria-label", `Mapa urbano de ${C.current.ciudad.nombre}`), n.on("load", () => {
				if (!t) {
					if (i.ciudad3d) {
						let e = new yt(i.centro);
						e.onStats = (e) => x.current.onCiudad?.({
							estado: "lista",
							stats: e
						}), e.onError = () => x.current.onCiudad?.({ estado: "error" }), n.addLayer(e, "bm-complemento-seleccion"), n.setLayoutProperty(rt, "visibility", "none"), b.current = e;
					}
					e.dataset.ready = "true", k(!0), x.current.onMapa(n ?? null);
				}
			}), n.on("moveend", () => {
				if (!n) return;
				let e = n.getCenter();
				zt = {
					ciudad: C.current.ciudad.id,
					center: [e.lng, e.lat],
					zoom: n.getZoom(),
					pitch: n.getPitch()
				};
			}), n.on("idle", () => {
				n && (e.dataset.zoom = n.getZoom().toFixed(2), e.dataset.pitch = n.getPitch().toFixed(0));
			}), n.on("error", (e) => {
				!t && !n?.loaded() && x.current.onFallo(), console.warn("karto:", e.error?.message);
			}), n.on("click", (e) => {
				n && (S.current && b.current && !n.queryRenderedFeatures(e.point, { layers: Vt.filter((e) => n.getLayer(e)) })[0] ? b.current.pick(e.point.x, e.point.y).then((t) => {
					x.current.onSeleccion(t ? {
						tabla: "edificio",
						id: t,
						propiedades: {
							...j.current.get(t),
							id: t
						}
					} : Wt(n, e.point));
				}) : x.current.onSeleccion(Wt(n, e.point)));
			}), n.on("mousemove", (e) => {
				if (!n) return;
				let t = Rt.map((e) => e.layer).filter((e) => n.getLayer(e) && e !== "bm-terreno" && e !== "bm-usos");
				n.getCanvas().style.cursor = n.queryRenderedFeatures(e.point, { layers: t }).length ? "pointer" : "";
			});
		}).catch(() => {
			t || x.current.onFallo();
		}), () => {
			t = !0, r.disconnect(), x.current.onMapa(null), n?.remove(), y.current = null, b.current = null;
		};
	}, []), t(() => {
		O && E && b.current && (x.current.onCiudad?.({ estado: "cargando" }), b.current.load(I(`${e.ciudad.id}/ciudad3d.json`, e.datos)));
	}, [
		O,
		E,
		e
	]), t(() => {
		let e = y.current;
		if (!e || !O) return;
		let t = (e) => a?.tabla === e ? a.id : "";
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
		]), b.current?.setSelected(t("edificio"));
	}, [a, O]), t(() => {
		let t = y.current;
		if (!t || !O) return;
		let n = Lt(s, e);
		for (let e of n.layers) if (t.getLayer(e.id) && "paint" in e) for (let [n, r] of Object.entries(e.paint ?? {})) t.setPaintProperty(e.id, n, r);
		let r = F[s].palette;
		b.current?.setTheme({
			night: r.noche,
			saturation: r.saturacion,
			selection: r.seleccion,
			fog: r.horizonte
		}), t.setLight(n.light), t.setSky(n.sky), _.current && (_.current.dataset.theme = s);
	}, [
		s,
		e,
		O
	]), t(() => {
		let e = y.current;
		e && O && l && e.getSource("bm-alturas").setData(l);
	}, [l, O]), t(() => {
		let e = y.current;
		if (!e || !O || !d) return;
		let t = new Set(f?.ocultos.edificio_complemento ?? []);
		e.getSource("bm-complemento").setData(t.size ? {
			...d,
			features: d.features.filter((e) => !t.has(String(e.properties?.id)))
		} : d);
	}, [
		d,
		f,
		O
	]), t(() => {
		let e = y.current;
		if (!e || !O) return;
		let t = f?.ocultos.edificio ?? [];
		for (let n of [
			"bm-edificios",
			"bm-edificios-borde",
			"bm-edificios-sombra"
		]) e.setFilter(n, Bt(t));
		e.setFilter("bm-edificios-3d", [
			"all",
			["has", "altura_m"],
			Bt(t)
		]);
		let n = (f?.lugaresMovidos.features ?? []).map((e) => String(e.properties?.id)), r = Bt([...f?.ocultos.lugar ?? [], ...n]);
		e.setFilter("bm-lugares", r), e.setFilter("bm-lugares-texto", r);
		let i = {
			type: "FeatureCollection",
			features: []
		};
		e.getSource("bm-lugares-movidos").setData(f?.lugaresMovidos ?? i), e.getSource("bm-agregados").setData(f?.edificiosAgregados ?? i), b.current?.setHidden(t);
	}, [f, O]), t(() => {
		let e = y.current;
		if (!e || !O) return;
		let t = Bt(f?.ocultos.edificio ?? []), n = u ? ["all", t] : [
			"all",
			t,
			[
				"!=",
				["get", "tipo"],
				"simulada"
			]
		];
		b.current?.setHideSimulated(!u), e.setFilter("bm-alturas-3d", n), e.setFilter("bm-alturas-sombra", n), e.setFilter("bm-alturas-seleccion", [
			"all",
			n,
			[
				"==",
				["get", "id"],
				a?.tabla === "edificio" ? a.id : ""
			]
		]);
	}, [
		u,
		a,
		f,
		O
	]), t(() => {
		let e = y.current;
		if (!e || !O) return;
		for (let t of Ht) e.setLayoutProperty(t, "visibility", T && !D ? "visible" : "none");
		for (let t of ["bm-complemento-3d", "bm-agregados-3d"]) e.setLayoutProperty(t, "visibility", T ? "visible" : "none");
		e.getLayer("bm-ciudad-3d") && e.setLayoutProperty(rt, "visibility", D ? "visible" : "none");
		for (let t of [
			"bm-arboles",
			"bm-arboles-sombra",
			"bm-edificios-sombra"
		]) e.getLayer(t) && e.setLayoutProperty(t, "visibility", D ? "none" : "visible");
		D && b.current?.rise(), e.getLayer("bm-lugares") && e.setLayerZoomRange("bm-lugares", D ? 18.4 : 15.5, 24), e.getLayer("bm-lugares-texto") && e.setLayerZoomRange("bm-lugares-texto", D ? 18.4 : 16, 24), T ? (e.dragRotate.enable(), e.touchZoomRotate.enableRotation(), e.touchPitch.enable()) : (e.dragRotate.disable(), e.touchZoomRotate.disableRotation(), e.touchPitch.disable());
		let [t, n] = Ut[o], r = o === "3d" ? Math.max(e.getPitch(), 68) : t;
		e.setMinPitch(0), e.setMaxPitch(85), e.easeTo({
			pitch: r,
			bearing: T ? e.getBearing() || -20 : 0,
			zoom: T ? Math.max(16.2, e.getZoom()) : e.getZoom(),
			duration: 900
		}), e.once("moveend", () => {
			e.setMinPitch(t), e.setMaxPitch(n);
		});
	}, [
		o,
		T,
		D,
		O
	]), /* @__PURE__ */ v("div", {
		ref: _,
		className: "karto-map",
		"data-testid": "mapa",
		"data-ready": "false",
		"data-theme": s,
		"data-modo": o,
		"data-modo3d": E ? "ciudad" : "clasico"
	});
}
// src/karto.tsx
function Kt({ datos: a = ce, ciudad: o = le, temaInicial: s = ae, tema: c, onTema: l, vistaInicial: u = "2d", vista: d, onVista: f, modo3dInicial: p = "clasico", modo3d: m, onModo3d: h, leyenda: g = !0, controles: b = !0, selectorTema: S = !0, ficha: C = !0, alturasModeladas: w = !0, onSeleccion: T, onMapa: E, children: O, className: k }) {
	let [A, j] = i(null), [M, ee] = i(null), [te, ne] = i(s), [N, re] = i(u), [ie, P] = i(w), [F, I] = i(!1), [ue, de] = i(p), [L, fe] = i(null), R = c ?? te, z = d ?? N, B = m ?? ue, V = z !== "2d", H = pe(a, o), U = me(a, o, V), _e = he(a, o), W = ge(a, o), G = n(() => H.datos ? {
		datos: a,
		ciudad: H.datos
	} : null, [a, H.datos]), ve = r({
		onSeleccion: T,
		onMapa: E
	});
	t(() => {
		ve.current = {
			onSeleccion: T,
			onMapa: E
		};
	}, [T, E]);
	let K = e((e) => {
		ee(e), ve.current.onSeleccion?.(e);
	}, []), ye = e((e) => {
		j(e), ve.current.onMapa?.(e);
	}, []), be = e(() => I(!0), []), xe = (e) => {
		ne(e), l?.(e);
	}, Se = (e) => {
		re(e), f?.(e);
	}, Ce = (e) => {
		de(e), h?.(e);
	}, we = !!H.datos?.ciudad3d && B === "ciudad", Te = n(() => {
		let e = {
			estimada: 0,
			simulada: 0
		};
		for (let t of U.datos?.features ?? []) {
			let n = t.properties?.tipo;
			n in e && (e[n] += 1);
		}
		return e;
	}, [U.datos]), q = n(() => {
		if (M?.tabla !== "edificio" || M.propiedades.altura_m !== void 0) return M;
		let e = U.datos?.features.find((e) => e.properties?.id === M.id);
		return e ? {
			...M,
			propiedades: {
				...M.propiedades,
				...e.properties
			}
		} : M;
	}, [M, U.datos]);
	return /* @__PURE__ */ y("div", {
		className: `karto${k ? ` ${k}` : ""}`,
		"aria-label": `Mapa urbano de ${H.datos?.nombre ?? ""}`,
		children: [
			G && /* @__PURE__ */ v(Gt, {
				origen: G,
				seleccion: M,
				vista: z,
				tema: R,
				modo3d: B,
				alturas: U.datos,
				mostrarSimuladas: ie,
				complemento: _e.datos,
				correcciones: W.datos,
				onSeleccion: K,
				onMapa: ye,
				onFallo: be,
				onCiudad: fe
			}, `${a}|${G.ciudad.id}`),
			b && H.datos && /* @__PURE__ */ v(x, {
				ciudad: H.datos,
				mapa: A,
				vista: z,
				onVista: Se,
				modo3d: B,
				onModo3d: Ce
			}),
			S && /* @__PURE__ */ v(se, {
				tema: R,
				onCambio: xe
			}),
			g && /* @__PURE__ */ v(oe, {
				tema: R,
				vista: z,
				ciudad3d: we
			}),
			V && /* @__PURE__ */ y("details", {
				className: "karto-height-notice",
				children: [
					/* @__PURE__ */ y("summary", { children: [z === "3d" ? "Vista 3D libre" : "Vista 2.5D", " · alturas"] }),
					z === "3d" && /* @__PURE__ */ v("span", {
						className: "karto-height-observed",
						children: "Gira e inclina con clic derecho o Ctrl + arrastrar; en pantalla táctil, con dos dedos."
					}),
					we && /* @__PURE__ */ v("span", {
						className: "karto-height-observed",
						"data-testid": "karto-estado-ciudad",
						children: L?.estado === "error" ? "No se pudo armar la ciudad 3D. Los volúmenes simples siguen disponibles." : L?.estado === "lista" && L.stats ? `Ciudad 3D: ${L.stats.edificios.toLocaleString("es-PE")} edificios, ${L.stats.arboles.toLocaleString("es-PE")} árboles por satélite y ${L.stats.vehiculos} vehículos de ejemplo` : "Armando la ciudad 3D…"
					}),
					U.error ? /* @__PURE__ */ y(_, { children: [
						"No se pudieron cargar las alturas.",
						" ",
						/* @__PURE__ */ v("button", {
							type: "button",
							onClick: U.reintentar,
							children: "Reintentar"
						})
					] }) : U.cargando ? "Cargando alturas…" : /* @__PURE__ */ y(_, { children: [/* @__PURE__ */ y("span", {
						className: "karto-height-observed",
						children: [
							H.datos?.alturas?.fuente ?? "Observadas",
							":",
							" ",
							Te.estimada.toLocaleString("es-PE")
						]
					}), /* @__PURE__ */ y("label", {
						className: "karto-height-simulated",
						children: [
							/* @__PURE__ */ v("input", {
								type: "checkbox",
								checked: ie,
								onChange: (e) => P(e.target.checked)
							}),
							"Modeladas: ",
							Te.simulada.toLocaleString("es-PE")
						]
					})] })
				]
			}),
			(F || H.error) && /* @__PURE__ */ y("div", {
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
			C && q && /* @__PURE__ */ v(D, {
				seleccion: q,
				onCerrar: () => K(null)
			}, `${q.tabla}-${q.id}`),
			O
		]
	});
}
export { le as CIUDAD_POR_DEFECTO, ce as DATOS_POR_DEFECTO, ae as DEFAULT_THEME, Kt as Karto, oe as Leyenda, F as MAP_THEMES, Gt as Mapa, Rt as SELECTABLE_LAYERS, Z as SOURCE, ie as THEME_NAMES, L as WORKER_URL, Lt as buildStyle, I as dataUrl, _e as loadMapRuntime, pe as useCiudad };
