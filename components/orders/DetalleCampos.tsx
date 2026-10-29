import React from 'react';
import { C, S, MONO } from '../panelTheme';
import type { PerfilDetalle, CampoDetalle } from '../../services/detalleProducto';

const chip = (activo: boolean): React.CSSProperties => ({
    padding: '7px 12px',
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    ...(activo
        ? { background: C.royal, color: '#FFFFFF', border: `1px solid ${C.royal}` }
        : { background: C.surface, color: C.body, border: `1px solid ${C.borderStrong}` }),
});

const Campo: React.FC<{ campo: CampoDetalle; valor: any; onChange: (v: string) => void }> = ({ campo, valor, onChange }) => {
    const actual = valor ?? campo.default;
    return (
        <div>
            <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>{campo.label}</span>
            {campo.tipo === 'chips' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {campo.opciones?.map(op => (
                        <button key={op.valor} type="button" onClick={() => onChange(op.valor)} style={chip(actual === op.valor)}>
                            <span>{op.label}</span>
                            {op.delta ? <span style={{ fontSize: 10, opacity: 0.8 }}>({op.delta > 0 ? '+' : ''}${op.delta})</span> : null}
                        </button>
                    ))}
                </div>
            )}
            {campo.tipo === 'texto' && (
                <input
                    type="text"
                    value={actual ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={campo.placeholder}
                    style={{ ...S.input, fontFamily: MONO }}
                />
            )}
            {campo.tipo === 'textarea' && (
                <textarea
                    value={actual ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={campo.placeholder}
                    rows={2}
                    style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }}
                />
            )}
            {campo.ayuda && <span style={{ display: 'block', fontSize: 10.5, color: C.faint, marginTop: 4 }}>{campo.ayuda}</span>}
        </div>
    );
};

interface DetalleCamposProps {
    perfil: PerfilDetalle;
    valores: Record<string, any>;
    onChange: (key: string, val: string) => void;
}

/** Renderiza los campos del perfil del producto (SRI, sello, láser, etc.). */
export const DetalleCampos: React.FC<DetalleCamposProps> = ({ perfil, valores, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {perfil.campos.map(campo => (
            <Campo key={campo.key} campo={campo} valor={valores?.[campo.key]} onChange={v => onChange(campo.key, v)} />
        ))}
    </div>
);

export default DetalleCampos;
