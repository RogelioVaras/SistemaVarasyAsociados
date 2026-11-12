/* Partida Doble · Constantes de dominio: plan de cuentas base, cuentas automáticas, tipos de documento y menú. */
/* ============ Constantes de dominio ============ */
const GRUPOS={AC:'Activo corriente',ANC:'Activo no corriente',PC:'Pasivo corriente',PNC:'Pasivo no corriente',PAT:'Patrimonio',ING:'Ingresos',COS:'Costos',GAS:'Gastos',IMP:'Impuesto a la renta'};
const RES=new Set(['ING','COS','GAS','IMP']);
const PLAN_BASE=[
 ['1101001','Caja','AC'],['1101002','Banco cuenta corriente','AC',1],['1101003','Fondo fijo','AC'],
 ['1102001','Clientes','AC'],['1102002','Documentos por cobrar','AC'],['1102003','Deudores varios','AC'],
 ['1103001','Existencias','AC'],['1104001','IVA crédito fiscal','AC'],['1104002','PPM','AC'],['1104003','Remanente crédito fiscal','AC'],['1105001','Anticipo a proveedores','AC'],['1105002','Anticipo de remuneraciones','AC'],
 ['1201001','Maquinarias y equipos','ANC'],['1201002','Muebles y útiles','ANC'],['1201003','Vehículos','ANC'],['1201004','Equipos computacionales','ANC'],['1202001','Depreciación acumulada','ANC'],
 ['2101001','Proveedores','PC'],['2101002','Acreedores varios','PC'],['2101003','Documentos por pagar','PC'],['2101004','Honorarios por pagar','PC'],
 ['2102001','IVA débito fiscal','PC'],['2102002','Retención impuesto segunda categoría','PC'],['2102003','Impuesto único por pagar','PC'],['2102004','PPM por pagar','PC'],
 ['2103001','Remuneraciones por pagar','PC'],['2103002','Leyes sociales por pagar','PC'],['2104001','Impuesto a la renta por pagar','PC'],['2102005','IVA retenido por pagar (cambio de sujeto)','PC'],['2105001','Préstamos bancarios corto plazo','PC'],
 ['2201001','Préstamos bancarios largo plazo','PNC'],
 ['3101001','Capital','PAT'],['3102001','Utilidades acumuladas','PAT'],['3102002','Retiros','PAT'],['3103001','Resultado del ejercicio','PAT'],
 ['4101001','Ventas','ING'],['4101002','Ventas exentas','ING'],['4102001','Otros ingresos','ING'],['4102002','Intereses ganados','ING'],
 ['5101001','Costo de ventas','COS'],['5101002','Compras de mercaderías e insumos','COS'],
 ['5201001','Remuneraciones','GAS'],['5201002','Leyes sociales','GAS'],['5201003','Honorarios','GAS'],['5201004','Arriendos','GAS'],['5201005','Servicios básicos','GAS'],
 ['5201006','Materiales de oficina','GAS'],['5201007','Gastos generales','GAS'],['5201008','Depreciación del ejercicio','GAS'],['5201009','Gastos bancarios','GAS'],['5201010','Intereses y gastos financieros','GAS'],
 ['5301001','Impuesto a la renta','IMP']
].map(([codigo,nombre,grupo,banco])=>({codigo,nombre,grupo,banco:!!banco,aux:['1102001','1102002','1102003','2101001','2101002','2101003','2101004'].includes(codigo)}));
const CLAVES_BASE={clientes:'1102001',proveedores:'2101001',ivaCF:'1104001',ivaDF:'2102001',ventas:'4101001',ventasEx:'4101002',compras:'5101002',resultado:'3103001',utilidades:'3102001',ivaRet:'2102005',honGasto:'5201003',honRet:'2102002',honPagar:'2101004',depGasto:'5201008',depAcum:'1202001',remGasto:'5201001',leyesGasto:'5201002',remPagar:'2103001',leyesPagar:'2103002',iuPagar:'2102003',antRem:'1105002',otrosDescRem:'2101002'};
const CLAVES_TXT={clientes:'Clientes',proveedores:'Proveedores',ivaCF:'IVA crédito fiscal',ivaDF:'IVA débito fiscal',ventas:'Ventas afectas',ventasEx:'Ventas exentas',compras:'Compras (cuenta por defecto)',resultado:'Resultado del ejercicio (cierre)',utilidades:'Utilidades acumuladas (apertura)',ivaRet:'IVA retenido facturas de compra',honGasto:'Gasto honorarios',honRet:'Retención honorarios por pagar',honPagar:'Honorarios por pagar',depGasto:'Gasto depreciación',depAcum:'Depreciación acumulada',remGasto:'Gasto remuneraciones',leyesGasto:'Aportes patronales',remPagar:'Remuneraciones por pagar',leyesPagar:'Leyes sociales por pagar',iuPagar:'Impuesto único por pagar',antRem:'Anticipos de remuneraciones',otrosDescRem:'Otros descuentos por pagar'};
const ORIGEN_TXT={compras:'Libro de compras',ventas:'Libro de ventas',banco:'Banco',pago:'Cuenta corriente',cierre:'Cierre del ejercicio',apertura:'Traspaso de resultado',saldos:'Saldos iniciales',honorarios:'Honorarios',dep:'Depreciación',ajusteUC:'Ajuste IVA uso común',remu:'Remuneraciones'};
const TIPOS_C={33:'Factura electrónica',34:'Factura exenta',46:'Factura de compra',56:'Nota de débito',61:'Nota de crédito',914:'Declaración de ingreso (DIN)'};
const TIPOS_V={33:'Factura electrónica',34:'Factura exenta',39:'Boleta electrónica',41:'Boleta exenta',56:'Nota de débito',61:'Nota de crédito'};
const CORTO={33:'F33',34:'F34',39:'B39',41:'B41',46:'FC46',56:'ND56',61:'NC61',914:'DIN'};
const REGIMENES=['14 D N°3 Pro Pyme General','14 D N°8 Pro Pyme Transparente','14 A Régimen General','Renta presunta','Otro'];
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const VIEWS=[
 ['Administración',[['empresas','Empresas'],['usuarios','Usuarios'],['cartera','Panel de cartera'],['plan','Plan de cuentas'],['calendario','Calendario'],['resumen','Resumen']]],
 ['Registros',[['diario','Libro diario'],['mayor','Libro mayor'],['compras','Libro de compras'],['ventas','Libro de ventas'],['honorarios','Honorarios'],['activo','Activo fijo'],['ctacte','Cuentas corrientes']]],
 ['Impuestos',[['iva','IVA y F29'],['renta','Renta anual']]],
 ['Personal',[['trabajadores','Trabajadores'],['remu','Remuneraciones']]],
 ['Tesorería',[['banco','Conciliación bancaria']]],
 ['Reportes',[['balance','Balance 8 columnas'],['eeff','Estados financieros'],['cierre','Cierre y apertura'],['historial','Historial de cambios']]]
];

