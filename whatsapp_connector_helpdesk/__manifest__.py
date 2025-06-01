# -*- coding: utf-8 -*-
# =====================================================================================
# License: OPL-1 (Odoo Proprietary License v1.0)
#
# By using or downloading this module, you agree not to make modifications that
# affect sending messages through Acruxlab or avoiding contract a Plan with Acruxlab.
# Support our work and allow us to keep improving this module and the service!
#
# Al utilizar o descargar este módulo, usted se compromete a no realizar modificaciones que
# afecten el envío de mensajes a través de Acruxlab o a evitar contratar un Plan con Acruxlab.
# Apoya nuestro trabajo y permite que sigamos mejorando este módulo y el servicio!
# =====================================================================================

{
    'name': 'ChatRoom HelpDesk extra. Enterprise version. WhatsApp',
    'summary': 'Create HelpDesk Ticket from ChatRoom. Send message from Ticket. WhatsApp HelpDesk. '
               'apichat.io GupShup Chat-Api ChatApi. Whatsapp, Instagram DM, FaceBook Messenger. ChatRoom 2.0.',
    'description': 'Create HelpDesk Ticket from ChatRoom. Send message from Ticket. '
                   'Whatsapp, Instagram DM, FaceBook Messenger. ChatRoom 2.0.',
    'version': '17.0.3.0',
    'author': 'AcruxLab',
    # 'live_test_url': 'https://chatroom.acruxlab.com/web/signup',
    'support': 'info@acruxlab.com',
    'price': 59.0,
    'currency': 'USD',
    'images': ['static/description/Banner_helpdesk_v10.gif'],
    'website': 'https://acruxlab.com/plans',
    'license': 'OPL-1',
    'application': True,
    'installable': True,
    'category': 'Discuss/Services/CRM',
    'depends': [
        'whatsapp_connector',
        'helpdesk',
    ],
    'data': [
        'views/helpdesk_ticket_views.xml',
        'views/conversation_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'whatsapp_connector_helpdesk/static/src/components/*/*.xml',
            'whatsapp_connector_helpdesk/static/src/jslib/chatroom.js',
        ],
    },
}
