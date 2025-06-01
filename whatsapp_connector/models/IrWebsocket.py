# -*- coding: utf-8 -*-
from odoo.http import request
from odoo.addons.bus.websocket import wsrequest
from odoo import models


class IrWebsocket(models.AbstractModel):
    _inherit = 'ir.websocket'

    def _build_bus_channel_list(self, channels):
        user_id = self.env.uid
        if user_id and self.env.user.has_group('whatsapp_connector.group_chat_basic'):
            req = request or wsrequest
            cids = req.httprequest.cookies.get('cids', str(req.env.company.id))
            cids = [int(cid) for cid in cids.split(',')]
            company_id = cids[0]
            channels = list(channels)
            # Regla security: company_id (= req.env.company) toma la definida en usuario. 15 < toma la real.
            connector_ids = self.env['acrux.chat.connector'].with_company(company_id)
            connector_ids = connector_ids.search([('company_id', '=', company_id)]).ids
            for conn_id in connector_ids:
                channels.append((self.env.registry.db_name, 'acrux.chat.conversation', company_id, conn_id))
            channels.append((self.env.registry.db_name, 'acrux.chat.conversation', 'private', company_id, user_id))
        return super()._build_bus_channel_list(channels)
