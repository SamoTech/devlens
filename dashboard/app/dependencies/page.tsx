      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 20 }}>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}><div style={{ fontSize: 24, fontWeight: 800 }}>{data.summary.total}</div><div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Packages</div></div>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}><div style={{ fontSize: 24, fontWeight: 800 }}>{data.summary.npm}</div><div style={{ color: 'var(--text-faint)', fontSize: 12 }}>npm</div></div>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}><div style={{ fontSize: 24, fontWeight: 800 }}>{data.summary.vulnerable}</div><div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Vulnerable</div></div>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}><div style={{ fontSize: 24, fontWeight: 800 }}>{data.summary.outdated}</div><div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Outdated</div></div>
            <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}><div style={{ fontSize: 24, fontWeight: 800 }}>{data.summary.majorUpdates}</div><div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Major</div></div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Package','Ecosystem','Installed','Latest','Update','Vulnerabilities','Fix','Sources'].map(h => <th key={h} style={{ padding: 12, color: 'var(--text-faint)', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {data.packages.map((d: any) => {
                  const meta = UPDATE_META[d.updateType as keyof typeof UPDATE_META] ?? UPDATE_META.unknown
                  return <tr key={d.ecosystem + ':' + d.name} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td style={{ padding: 12, fontWeight: 700 }}>{d.name}</td>
                    <td style={{ padding: 12 }}>{d.ecosystem}</td>
                    <td style={{ padding: 12, fontFamily: 'monospace' }}>{d.installedVersion}</td>
                    <td style={{ padding: 12, fontFamily: 'monospace' }}>{d.latestVersion ?? '—'}</td>
                    <td style={{ padding: 12, color: meta.color, fontWeight: 700 }}>{meta.label}</td>
                    <td style={{ padding: 12, color: d.vulnerabilityCount ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{d.vulnerabilityCount}</td>
                    <td style={{ padding: 12, color: 'var(--success)', fontFamily: 'monospace' }}>{d.patchedVersion ?? '—'}</td>
                    <td style={{ padding: 12, color: 'var(--text-faint)' }}>{d.sources.length ? d.sources.join(', ') : '—'}</td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
