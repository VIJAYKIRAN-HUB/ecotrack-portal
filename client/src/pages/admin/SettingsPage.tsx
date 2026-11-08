import React, { useState, useEffect } from 'react';
import { Settings, Database, Server, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Terminal } from 'lucide-react';
import { api } from '../../services/api.js';

export const SettingsPage: React.FC = () => {
  const [mongoHealth, setMongoHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.getMongoHealth();
      setMongoHealth(res);
    } catch (err: any) {
      setMongoHealth({ status: 'disconnected', error: err.message || 'Could not connect to MongoDB' });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const isConnected = mongoHealth?.status === 'healthy' || mongoHealth?.status === 'connected';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-forest-700" />
          System Settings & Database Status
        </h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Local engine parameters, MongoDB connection health, and developer commands.
        </p>
      </div>

      {/* MongoDB Live Health Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-5">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Local MongoDB Database (ecotrack)</h3>
              <p className="text-xs text-charcoal-500">Live connection to mongodb://127.0.0.1:27017/ecotrack</p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loadingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-charcoal-700 bg-charcoal-100 hover:bg-charcoal-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-100">
            <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block">Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">Offline / Fallback</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-100">
            <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block">Database Name</span>
            <span className="text-xs font-bold text-charcoal-900 font-mono mt-1 block">
              {mongoHealth?.database || 'ecotrack'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-100">
            <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block">Ping Latency</span>
            <span className="text-xs font-bold text-forest-700 font-mono mt-1 block">
              {mongoHealth?.pingMs !== undefined ? `${mongoHealth.pingMs} ms` : '—'}
            </span>
          </div>
        </div>

        {isConnected && mongoHealth?.collections && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs">
            <div className="font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Active Collections ({mongoHealth.collections.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mongoHealth.collections.map((colName: string) => (
                <span
                  key={colName}
                  className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-lg font-mono font-medium"
                >
                  {colName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Configuration */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-500 border-b border-charcoal-100 pb-2">
          Engine Parameters
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-100">
            <div>
              <div className="font-bold text-charcoal-900">Duplicate Matching Threshold</div>
              <div className="text-charcoal-500 mt-0.5">
                Composite threshold for geospatial, token overlap, and category similarity
              </div>
            </div>
            <span className="font-mono font-bold text-forest-800 bg-forest-100 px-3 py-1 rounded-lg">
              60%
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-50 border border-charcoal-100">
            <div>
              <div className="font-bold text-charcoal-900">SLA Overdue Threshold</div>
              <div className="text-charcoal-500 mt-0.5">
                Complaints unresolved beyond this window are flagged as overdue
              </div>
            </div>
            <span className="font-mono font-bold text-charcoal-800 bg-charcoal-200 px-3 py-1 rounded-lg">
              48 Hours
            </span>
          </div>
        </div>

        {/* MongoDB Commands & Compass Inspection */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-500 border-b border-charcoal-100 pb-2 pt-4 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          MongoDB CLI Commands & Verification in MongoDB Compass
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-charcoal-950 text-white font-mono text-xs space-y-2">
            <div className="text-charcoal-400"># Start both Frontend and Backend together:</div>
            <div className="text-emerald-400 font-bold">npm run dev</div>

            <div className="text-charcoal-400 pt-2"># Populate initial demo records into MongoDB:</div>
            <div className="text-emerald-400 font-bold">npm run seed:mongo</div>

            <div className="text-charcoal-400 pt-2"># Reset and re-seed clean demo data in MongoDB:</div>
            <div className="text-emerald-400 font-bold">npm run seed:mongo:reset</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-2">
            <div className="font-bold text-blue-950 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              How to verify saved documents in MongoDB Compass:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 pl-1 leading-relaxed">
              <li>Launch <strong>MongoDB Compass</strong> on your computer.</li>
              <li>Paste the connection string: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">mongodb://127.0.0.1:27017</code> and click <strong>Connect</strong>.</li>
              <li>In the left sidebar, click on the <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">ecotrack</code> database.</li>
              <li>Click on the <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">complaints</code> collection to inspect all submitted waste complaints with their full status histories and photo URLs.</li>
              <li>Check the other collections: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">users</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">notifications</code>, <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">activity_logs</code>, and <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">duplicate_relationships</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
