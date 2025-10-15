'use client';

import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export function MessagesList() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('messages.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Communicate with agents and support team
                </p>
            </div>

            {/* Messages Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">
                            {t('messages.conversations')}
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search messages..."
                                className="pl-8"
                            />
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-4">
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p className="text-sm">{t('messages.noMessages')}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Select a conversation
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="flex-1 flex flex-col h-full">
                        {/* Empty State */}
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="mx-auto h-16 w-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">
                                    {t('messages.startConversation')}
                                </p>
                                <p className="text-sm mt-2">
                                    Select a conversation from the list or start a new one
                                </p>
                            </div>
                        </div>

                        {/* Message Input (Disabled in empty state) */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Type a message..."
                                    disabled
                                />
                                <Button size="icon" disabled>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
