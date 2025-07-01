// components/SensorData.tsx
interface SensorDataProps {
  readingsByUser: Record<number, Record<string, string>>;
  isMaster: boolean;
}

export default function SensorData({ readingsByUser, isMaster }: SensorDataProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4 border border-gray-200 space-y-6">
      <h2 className="text-xl font-semibold text-blue-700">Sensor Data</h2>
      {Object.entries(readingsByUser).map(([userId, sensors]) => (
        <div key={userId} className="border-t pt-2">
          {isMaster && (
            <h3 className="text-md font-semibold text-gray-600">User ID: {userId}</h3>
          )}
          <ul className="text-gray-800">
            {Object.entries(sensors).map(([type, value]) => (
              <li key={type}>
                <strong>{type.charAt(0).toUpperCase() + type.slice(1)}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
