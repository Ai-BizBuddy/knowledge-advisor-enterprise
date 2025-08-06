
import { Card } from "flowbite-react";
import { IStatusCardProps } from "../../interfaces/StatusCard";

/**
 * StatusCard component displays a statistic with an icon
 */
export default function StatusCard({ name, value, icon, color }: IStatusCardProps) {
    return (
        <Card className="w-80 h-24 dark:bg-gray-900">
            <div className="flex flex-row justify-between items-center dark:bg-gray-900">
                <div className="flex flex-col">
                    <p className="text-xl font-bold tracking-tight sm:text-2xl card-title text-gray-900 dark:text-white">
                        {name}
                    </p>
                    <p className="text-xl font-bold tracking-tight sm:text-2xl card-title text-gray-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <div className={`${color} rounded-xl w-12 h-12 flex justify-center items-center`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}