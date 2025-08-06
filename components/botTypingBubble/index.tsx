import { UI_CONSTANTS } from '@/constants';

/**
 * BotTypingBubble component shows a typing indicator for the chat bot
 */
export default function BotTypingBubble() {
    return (
        <div className="flex items-start gap-2.5">
            {/* Bot Avatar */}
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />

            {/* Typing bubble */}
            <div className="px-4 py-2.5 rounded-2xl bg-gray-200 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 max-w-[320px] rounded-bl-none">
                <div className="flex space-x-1" role="status" aria-label="Bot is typing">
                    <span
                        className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_1}ms` }}
                    />
                    <span
                        className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_2}ms` }}
                    />
                    <span
                        className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${UI_CONSTANTS.ANIMATION_DELAY_3}ms` }}
                    />
                </div>
            </div>
        </div>
    );
}
