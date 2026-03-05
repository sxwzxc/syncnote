interface DataItem {
  label: string
  value: string | number
  color: string
}

interface Feature {
  title: string
  description: string
}

interface DataDisplayProps {
  title: string
  description: string
  data: DataItem[]
  features: Feature[]
}

export const DataDisplay = ({ title, description, data, features }: DataDisplayProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <div className="space-y-2 text-left mb-6">
        {data.map((item, index) => (
          <p key={index} className="text-gray-700">
            <span className="text-primary font-medium">{item.label}:</span>{" "}
            <span className={item.color}>{item.value}</span>
          </p>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <h3 className="text-primary font-semibold mb-2">Features</h3>
        <div className="text-sm text-gray-700 space-y-1">
          {features.map((feature, index) => (
            <p key={index}>
              • <strong>{feature.title}:</strong> {feature.description}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}