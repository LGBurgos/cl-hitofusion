# -*- coding: utf-8 -*-

from odoo import models


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        result = super(IrHttp, self).session_info()
        if self.env.user.has_group('whatsapp_connector.group_chat_basic_extra'):
            Config = self.env['ir.config_parameter'].sudo()
            release_conv = Config.get_param('chatroom.release.conv.on.close', 'False') == 'True'
            result['chatroom_release_conv_on_close'] = release_conv
            result['chatroom_max_file_upload_size'] = int(Config.get_param('acrux_max_weight_kb', default=2 * 1024))
            result['chatroom_max_file_upload_size'] *= 1024  # kb -> bytes
        return result
