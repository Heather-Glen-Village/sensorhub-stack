// components/Alert.tsx
interface Alert {
  user_id: number;
  sensor_type: string;
  measurement: string;
  severity: string;
  message: string;
}

interface AlertProps {
  alerts: Alert[];
}

export default function AlertPanel({ alerts }: AlertProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-200 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">Active Alerts</h2>
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map((alert, index) => (
            <li key={index} className="text-sm text-gray-700">
              <span className="font-semibold">{alert.sensor_type}:</span> {alert.message} – 
              <span className="ml-1 text-xs text-gray-500">({alert.measurement})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No active alerts.</p>
      )}
    </div>
  );
}
