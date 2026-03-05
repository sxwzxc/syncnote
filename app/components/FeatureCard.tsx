import { Link } from "react-router"
import { Button } from "~/components/ui/button"

interface FeatureCardProps {
  title: string
  description: string
  demoLink: string
  className?: string
}

const FeatureCard = ({ title, description, demoLink, className = "" }: FeatureCardProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 ${className}`}>
      <div className="h-16">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      </div>
      <div className="h-16">
        <p className="text-gray-600 leading-relaxed mb-4">{description}</p>
      </div>
      <Link to={demoLink}>
        <Button className="w-full bg-primary hover:bg-primary-dark text-white cursor-pointer">
          View Demo
        </Button>
      </Link>
    </div>
  )
}

export default FeatureCard