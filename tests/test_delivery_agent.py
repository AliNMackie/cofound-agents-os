import unittest
from unittest.mock import MagicMock, patch
import json
import base64
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.delivery_agent.main import delivery_agent, handle_report_ready

class TestDeliveryAgent(unittest.TestCase):

    @patch('src.delivery_agent.main.handle_report_ready')
    def test_delivery_agent_pubsub(self, mock_handle):
        # Simulate Cloud Event with PubSub message
        payload = json.dumps({
            'userId': 'user_123',
            'status': 'completed',
            'contractId': 'contract_abc'
        })
        b64_payload = base64.b64encode(payload.encode('utf-8')).decode('utf-8')
        
        mock_event = MagicMock()
        mock_event.data = {'message': {'data': b64_payload}}
        
        delivery_agent(mock_event)
        
        mock_handle.assert_called_with('user_123', 'contract_abc')

    @patch('src.delivery_agent.main.get_db')
    @patch('src.delivery_agent.main.notify_user')
    def test_handle_report_ready(self, mock_notify, mock_get_db):
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        handle_report_ready('user_123', 'contract_abc')
        
        # Verify status update
        mock_db.collection.assert_called_with('users')
        mock_db.collection.return_value.document.assert_called_with('user_123')
        mock_db.collection.return_value.document.return_value.set.assert_called_once()
        
        # Verify notification
        mock_notify.assert_called_with('user_123', "Your Verified Report is ready.")

if __name__ == '__main__':
    unittest.main()
