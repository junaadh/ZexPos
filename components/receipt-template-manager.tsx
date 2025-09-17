"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    Settings,
    Plus,
    Save,
    Eye,
    Printer,
    FileText,
    Layout,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ReceiptTemplate, ReceiptHeaderConfig, ReceiptFooterConfig } from '@/lib/types';

interface ReceiptTemplateManagerProps {
    restaurantId: string;
}

export function ReceiptTemplateManager({ restaurantId }: ReceiptTemplateManagerProps) {
    const [templates, setTemplates] = useState<ReceiptTemplate[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<ReceiptTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<ReceiptTemplate>>({
        name: '',
        template_type: 'thermal',
        width: 80,
        font_size: 12,
        header_config: {
            show_logo: true,
            show_restaurant_name: true,
            show_address: true,
            show_contact: true,
            custom_header: '',
        },
        footer_config: {
            show_thank_you: true,
            thank_you_message: 'Thank you for dining with us!',
            show_return_policy: true,
            return_policy_text: 'No returns on food items. Please speak to a manager for any concerns.',
            show_website: false,
            show_social: false,
            custom_footer: '',
        },
        is_default: false,
    });

    useEffect(() => {
        fetchTemplates();
    }, [restaurantId]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`/api/receipt-templates?restaurantId=${restaurantId}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);

                // Set current template to default one
                const defaultTemplate = data.find((t: ReceiptTemplate) => t.is_default);
                if (defaultTemplate) {
                    setCurrentTemplate(defaultTemplate);
                }
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);

            const templateData = {
                ...formData,
                restaurant_id: restaurantId,
            };

            const url = isEditing && currentTemplate
                ? `/api/receipt-templates?id=${currentTemplate.id}`
                : '/api/receipt-templates';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save template');
            }

            const savedTemplate = await response.json();

            if (isEditing) {
                setTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t));
            } else {
                setTemplates(prev => [...prev, savedTemplate]);
            }

            setCurrentTemplate(savedTemplate);
            setShowDialog(false);
            setIsEditing(false);
            toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save template');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (template: ReceiptTemplate) => {
        setFormData(template);
        setCurrentTemplate(template);
        setIsEditing(true);
        setShowDialog(true);
    };

    const handleNew = () => {
        setFormData({
            name: '',
            template_type: 'thermal',
            width: 80,
            font_size: 12,
            header_config: {
                show_logo: true,
                show_restaurant_name: true,
                show_address: true,
                show_contact: true,
                custom_header: '',
            },
            footer_config: {
                show_thank_you: true,
                thank_you_message: 'Thank you for dining with us!',
                show_return_policy: true,
                return_policy_text: 'No returns on food items. Please speak to a manager for any concerns.',
                show_website: false,
                show_social: false,
                custom_footer: '',
            },
            is_default: false,
        });
        setIsEditing(false);
        setShowDialog(true);
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const updateHeaderConfig = (field: keyof ReceiptHeaderConfig, value: any) => {
        setFormData(prev => ({
            ...prev,
            header_config: {
                ...prev.header_config!,
                [field]: value,
            },
        }));
    };

    const updateFooterConfig = (field: keyof ReceiptFooterConfig, value: any) => {
        setFormData(prev => ({
            ...prev,
            footer_config: {
                ...prev.footer_config!,
                [field]: value,
            },
        }));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Receipt Templates
                    </CardTitle>
                    <Button onClick={handleNew} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Current Template Info */}
                {currentTemplate && (
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">{currentTemplate.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {currentTemplate.template_type} • {currentTemplate.width}mm •
                                    {currentTemplate.is_default ? ' Default' : ''}
                                </p>
                            </div>
                            <Button onClick={() => handleEdit(currentTemplate)} variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </div>
                )}

                {/* Template List */}
                <div className="space-y-2">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${currentTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                            onClick={() => setCurrentTemplate(template)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {template.template_type === 'thermal' ? (
                                        <Printer className="h-4 w-4 text-muted-foreground" />
                                    ) : template.template_type === 'a4' ? (
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Layout className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="font-medium">{template.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {template.template_type} • {template.width}mm
                                        </p>
                                    </div>
                                </div>
                                {template.is_default && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                        Default
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Template Editor Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {isEditing ? 'Edit Template' : 'Create New Template'}
                            </DialogTitle>
                            <DialogDescription>
                                Configure your receipt template settings
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Settings */}
                            <div className="space-y-4">
                                <h3 className="font-medium">Basic Settings</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="template-name">Template Name</Label>
                                        <Input
                                            id="template-name"
                                            value={formData.name}
                                            onChange={(e) => updateFormData('name', e.target.value)}
                                            placeholder="e.g., Default Thermal"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="template-type">Template Type</Label>
                                        <Select
                                            value={formData.template_type}
                                            onValueChange={(value) => updateFormData('template_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                                                <SelectItem value="a4">A4 Paper</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="width">Width (mm)</Label>
                                        <Input
                                            id="width"
                                            type="number"
                                            value={formData.width}
                                            onChange={(e) => updateFormData('width', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="font-size">Font Size</Label>
                                        <Input
                                            id="font-size"
                                            type="number"
                                            value={formData.font_size}
                                            onChange={(e) => updateFormData('font_size', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is-default"
                                        checked={formData.is_default}
                                        onCheckedChange={(checked) => updateFormData('is_default', checked)}
                                    />
                                    <Label htmlFor="is-default">Set as default template</Label>
                                </div>
                            </div>

                            <Separator />

                            {/* Header Configuration */}
                            <div className="space-y-4">
                                <h3 className="font-medium">Header Configuration</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.header_config?.show_logo}
                                            onCheckedChange={(checked) => updateHeaderConfig('show_logo', checked)}
                                        />
                                        <Label>Show Logo</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.header_config?.show_restaurant_name}
                                            onCheckedChange={(checked) => updateHeaderConfig('show_restaurant_name', checked)}
                                        />
                                        <Label>Show Restaurant Name</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.header_config?.show_address}
                                            onCheckedChange={(checked) => updateHeaderConfig('show_address', checked)}
                                        />
                                        <Label>Show Address</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.header_config?.show_contact}
                                            onCheckedChange={(checked) => updateHeaderConfig('show_contact', checked)}
                                        />
                                        <Label>Show Contact Info</Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="custom-header">Custom Header Text</Label>
                                    <Textarea
                                        id="custom-header"
                                        value={formData.header_config?.custom_header || ''}
                                        onChange={(e) => updateHeaderConfig('custom_header', e.target.value)}
                                        placeholder="Optional custom header text"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Footer Configuration */}
                            <div className="space-y-4">
                                <h3 className="font-medium">Footer Configuration</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.footer_config?.show_thank_you}
                                            onCheckedChange={(checked) => updateFooterConfig('show_thank_you', checked)}
                                        />
                                        <Label>Show Thank You Message</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.footer_config?.show_return_policy}
                                            onCheckedChange={(checked) => updateFooterConfig('show_return_policy', checked)}
                                        />
                                        <Label>Show Return Policy</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.footer_config?.show_website}
                                            onCheckedChange={(checked) => updateFooterConfig('show_website', checked)}
                                        />
                                        <Label>Show Website</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.footer_config?.show_social}
                                            onCheckedChange={(checked) => updateFooterConfig('show_social', checked)}
                                        />
                                        <Label>Show Social Media</Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="thank-you-message">Thank You Message</Label>
                                    <Input
                                        id="thank-you-message"
                                        value={formData.footer_config?.thank_you_message || ''}
                                        onChange={(e) => updateFooterConfig('thank_you_message', e.target.value)}
                                        placeholder="Thank you for dining with us!"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="return-policy">Return Policy Text</Label>
                                    <Textarea
                                        id="return-policy"
                                        value={formData.footer_config?.return_policy_text || ''}
                                        onChange={(e) => updateFooterConfig('return_policy_text', e.target.value)}
                                        placeholder="No returns on food items..."
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="custom-footer">Custom Footer Text</Label>
                                    <Textarea
                                        id="custom-footer"
                                        value={formData.footer_config?.custom_footer || ''}
                                        onChange={(e) => updateFooterConfig('custom_footer', e.target.value)}
                                        placeholder="Optional custom footer text"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button onClick={() => setShowDialog(false)} variant="outline">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isLoading || !formData.name}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isLoading ? 'Saving...' : 'Save Template'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

export default ReceiptTemplateManager;
