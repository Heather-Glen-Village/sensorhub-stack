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
        <div key={userId} className="border-t pt-4">
          {isMaster && (
            <h3 className="text-md font-semibold text-gray-600 mb-2">User ID: {userId}</h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-800">
            {Object.entries(sensors).map(([type, value]) => (
              <div key={type} className="flex flex-col bg-gray-50 p-3 rounded-md border border-gray-200">
                <span className="font-semibold text-gray-600">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
