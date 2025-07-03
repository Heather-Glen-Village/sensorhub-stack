// components/Alert.tsx
interface Alert {
  id: number;
  user_id: number;
  sensor_type: string;
  measurement: string;
  severity: string;
  message: string;
  helpText: string;            // New field for per-alert help
}

interface AlertProps {
  alerts: Alert[];
  onResolve?: (alert: Alert) => void;
}

export default function AlertPanel({
  alerts,
  onResolve,
}: AlertProps) {
  return (
    <div className="bg-white w-full shadow rounded-lg p-4 border border-gray-200 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">Active Alerts</h2>

      {alerts.length > 0 ? (
        <ul className="space-y-4">
          {alerts.map((alert, idx) => (
            <li
              key={idx}
              className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 p-3 rounded"
            >
              <div>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{alert.sensor_type}:</span>{" "}
                  {alert.message}{" "}
                  <span className="ml-1 text-xs text-gray-500">
                    ({alert.measurement})
                  </span>
                </p>
                <p className="mt-1 text-sm text-blue-600">{alert.helpText}</p>
              </div>

              {onResolve && (
                <button
                  onClick={() => onResolve(alert)}
                  className="mt-3 md:mt-0 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Resolve
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No active alerts.</p>
      )}
    </div>
  );
}
