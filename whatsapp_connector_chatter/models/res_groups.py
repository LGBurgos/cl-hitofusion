# -*- coding: utf-8 -*-

from odoo import api, models


class ResGroups(models.Model):
    _inherit = 'res.groups'

    @api.model
    def add_all_users_to_group(self):
        if not self.env['ir.config_parameter'].sudo().get_param('whatsapp_connector_chatter.group_chat_in_chatter'):
            chatter_group = self.env.ref('whatsapp_connector_chatter.group_chat_in_chatter')
            basic_group = self.env.ref('whatsapp_connector.group_chat_basic')
            chatter_group.write({'users': [(6, 0, basic_group.users.ids)]})
            self.env['ir.config_parameter'].sudo().set_param('whatsapp_connector_chatter.group_chat_in_chatter',
                                                             'created')
