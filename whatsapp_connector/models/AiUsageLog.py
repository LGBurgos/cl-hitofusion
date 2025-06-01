# -*- coding: utf-8 -*-

from odoo import models, api, fields


class AiUsageLog(models.Model):
    _name = 'acrux.chat.ai.usage.log'
    _description = 'AI Usage Log'
    _order = 'create_date desc'

    user_id = fields.Many2one('res.users', ondelete='set null', readonly=True)
    conversation_id = fields.Many2one('acrux.chat.conversation', ondelete='set null', readonly=True)
    ai_config_id = fields.Many2one('acrux.chat.ai.config', string='AI Config',
                                   ondelete='set null', readonly=True)
    provider = fields.Selection(related='ai_config_id.provider', store=True, readonly=True)

    operation_key = fields.Char('Operation', compute='_compute_readonly_data',
                                store=True, readonly=True, compute_sudo=True)
    ai_model = fields.Char('AI Model', compute='_compute_readonly_data',
                           store=True, readonly=True, compute_sudo=True)
    company_id = fields.Many2one('res.company', string='Company', compute='_compute_readonly_data', ondelete='cascade',
                                 store=True, readonly=True, compute_sudo=True)

    sent_tokens = fields.Integer('Sent Tokens', readonly=True)
    response_tokens = fields.Integer('Response Tokens', readonly=True)
    total_tokens = fields.Integer('Total Tokens', readonly=True)

    @api.depends('user_id', 'conversation_id', 'ai_config_id')
    def _compute_readonly_data(self):
        for log in self:
            if log.ai_config_id:
                log.operation_key = log.ai_config_id.operation_id.key
                log.ai_model = log.ai_config_id.ai_model_id.key
            if log.ai_config_id and log.ai_config_id.company_id:
                log.company_id = log.ai_config_id.company_id.id
            elif log.conversation_id:
                log.company_id = log.conversation_id.company_id.id
            elif log.user_id:
                log.company_id = log.user_id.company_id.id
            else:
                log.company_id = log.env.company.id
